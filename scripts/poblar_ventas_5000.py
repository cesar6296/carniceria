#!/usr/bin/env python3
"""Puebla la colección ventas con exactamente 5,000 documentos realistas.

El script usa los catálogos existentes de la aplicación para conservar las
relaciones con clientes, sucursales y cortes. Los documentos se insertan en
cinco lotes de 1,000 registros y al final se crean los índices de ventas.

Instalación:
    python3 -m pip install -r requirements.txt

Ejecución local:
    python3 scripts/poblar_ventas_5000.py

También acepta MONGODB_URI y MONGODB_DB desde el entorno. La base de datos
puede venir incluida en la URI de MongoDB; --db tiene prioridad si se indica.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import time
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import certifi
from bson import ObjectId
from dotenv import load_dotenv
from faker import Faker
from pymongo import ASCENDING, DESCENDING, IndexModel, MongoClient
from pymongo.errors import ConfigurationError


load_dotenv(Path(__file__).resolve().parents[1] / ".env")


CANTIDAD_DOCUMENTOS = 5_000
TAMANIO_LOTE = 1_000
COLECCION_PRINCIPAL = "ventas"
IDIOMA_FAKER = "es_MX"


# Coordenadas aproximadas por ciudad, iguales al criterio de la aplicación.
# Nunca se generan direcciones particulares ni coordenadas inventadas para
# ciudades que no estén en este catálogo.
COORDENADAS_CIUDADES = {
    "culiacan": (24.8091, -107.3940),
    "hermosillo": (29.0729, -110.9559),
    "monterrey": (25.6866, -100.3161),
    "saltillo": (25.4380, -100.9737),
    "ciudad de mexico": (19.4326, -99.1332),
    "cdmx": (19.4326, -99.1332),
    "guadalajara": (20.6597, -103.3496),
    "oaxaca de juarez": (17.0732, -96.7266),
    "oaxaca": (17.0732, -96.7266),
    "merida": (20.9674, -89.5926),
}


def normalizar(texto: Any) -> str:
    """Normaliza ciudades sin quitar el valor original del documento."""
    valor = str(texto or "").strip().lower()
    reemplazos = str.maketrans("áéíóúüñ", "aeiouun")
    return valor.translate(reemplazos)


def redondear(valor: float) -> float:
    return round(float(valor) + 1e-10, 2)


def obtener_argumentos() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Inserta exactamente 5,000 ventas realistas en MongoDB."
    )
    parser.add_argument(
        "--uri",
        default=os.getenv("MONGODB_URI", "mongodb://localhost:27017/"),
        help="URI de MongoDB (por defecto usa MONGODB_URI o localhost).",
    )
    parser.add_argument(
        "--db",
        default=os.getenv("MONGODB_DB") or os.getenv("MONGO_DB_NAME"),
        help="Nombre de la base; si se omite se toma de la URI o se usa carniceria.",
    )
    parser.add_argument(
        "--semilla",
        type=int,
        help="Semilla opcional para repetir la misma generación de datos.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Muestra un ejemplo y valida catálogos sin insertar ni crear índices.",
    )
    return parser.parse_args()


def obtener_base(client: MongoClient, nombre_indicado: str | None):
    if nombre_indicado:
        return client[nombre_indicado]

    try:
        base_por_uri = client.get_default_database()
    except ConfigurationError:
        base_por_uri = None
    return base_por_uri if base_por_uri is not None else client["carniceria"]


def cargar_catalogos(db) -> dict[str, list[dict[str, Any]]]:
    """Carga catálogos existentes para mantener referencias consistentes."""
    catalogos = {
        "clientes": list(db.clientes.find({}).sort("id", ASCENDING)),
        "sucursales": list(db.sucursales.find({"activa": {"$ne": False}}).sort("id", ASCENDING)),
        "cortes": list(db.cortes.find({"activo": {"$ne": False}}).sort("id", ASCENDING)),
    }

    faltantes = [nombre for nombre, documentos in catalogos.items() if not documentos]
    if faltantes:
        raise RuntimeError(
            "Faltan catálogos en MongoDB: "
            + ", ".join(faltantes)
            + ". Ejecuta primero `npm run seed:catalogos` y vuelve a intentar."
        )

    return catalogos


def construir_ubicacion(cliente: dict[str, Any]) -> dict[str, Any]:
    ciudad = str(cliente.get("ciudad") or "").strip()
    pais = str(cliente.get("pais") or "México").strip()
    coordenadas = COORDENADAS_CIUDADES.get(normalizar(ciudad))

    if coordenadas:
        latitud, longitud = coordenadas
        return {
            "ciudad": ciudad or None,
            "pais": pais,
            "lat": latitud,
            "lng": longitud,
            "precision": "ciudad",
        }

    return {
        "ciudad": ciudad or None,
        "pais": pais or None,
        "lat": None,
        "lng": None,
        "precision": "sin_ubicacion",
    }


def elegir_cliente(fake: Faker, clientes: list[dict[str, Any]], sucursal: dict[str, Any]):
    """Prefiere clientes de la región de la sucursal, pero permite variedad."""
    misma_region = [
        cliente
        for cliente in clientes
        if cliente.get("region_id") == sucursal.get("region_id")
    ]
    opciones = misma_region or clientes
    return fake.random_element(opciones)


def crear_documento_venta(
    fake: Faker,
    catalogos: dict[str, list[dict[str, Any]]],
    prefijo_folio: str,
    consecutivo: int,
) -> dict[str, Any]:
    sucursal = fake.random_element(catalogos["sucursales"])
    cliente = elegir_cliente(fake, catalogos["clientes"], sucursal)
    cortes = catalogos["cortes"]

    cantidad_items = fake.random_int(min=1, max=min(4, len(cortes)))
    disponibles = list(cortes)
    items: list[dict[str, Any]] = []
    total = 0.0

    for _ in range(cantidad_items):
        posicion = fake.random_int(min=0, max=len(disponibles) - 1)
        corte = disponibles.pop(posicion)
        precio_kg = float(corte["precio_kg"])
        kg = fake.random_int(min=5, max=60) / 10
        subtotal = redondear(kg * precio_kg)
        total += subtotal

        items.append(
            {
                "corte_id": int(corte["id"]),
                "corte": corte["nombre"],
                "tipo_carne": corte["tipo_carne"],
                "kg": kg,
                "precio_kg": precio_kg,
                "subtotal": subtotal,
            }
        )

    ahora = datetime.now(timezone.utc)
    fecha_venta = fake.date_time_between(
        start_date=ahora - timedelta(days=365),
        end_date=ahora,
        tzinfo=timezone.utc,
    )
    if fecha_venta.tzinfo is None:
        fecha_venta = fecha_venta.replace(tzinfo=timezone.utc)

    minutos_actualizacion = fake.random_int(min=0, max=180)
    updated_at = min(ahora, fecha_venta + timedelta(minutes=minutos_actualizacion))
    estatus = "completada" if fake.random_int(min=1, max=100) <= 95 else "cancelada"
    region = sucursal.get("region_nombre") or f"Región {sucursal['region_id']}"

    return {
        "folio": f"{prefijo_folio}-{consecutivo:04d}",
        "fecha_venta": fecha_venta,
        "cliente": {
            "id": int(cliente["id"]),
            "nombre": cliente["nombre"],
            "tipo": cliente.get("tipo", "mostrador"),
            "ciudad": cliente.get("ciudad"),
            "pais": cliente.get("pais", "México"),
            "ubicacion": construir_ubicacion(cliente),
        },
        "sucursal": {
            "id": int(sucursal["id"]),
            "nombre": sucursal["nombre"],
            "region_id": int(sucursal["region_id"]),
            "region": region,
        },
        "items": items,
        "pago": {
            "metodo": fake.random_element(["efectivo", "tarjeta", "transferencia"]),
            "total": redondear(total),
        },
        "estatus": estatus,
        # Mongoose agrega estos campos con timestamps; se incluyen para que
        # la colección generada por Python se comporte igual que la de Node.
        "createdAt": fecha_venta,
        "updatedAt": updated_at,
    }


def crear_indices_ventas(collection) -> list[str]:
    """Crea los índices usados por consultas, historial y Live View."""
    indices = [
        IndexModel([("folio", ASCENDING)], unique=True, name="folio_1"),
        IndexModel([("fecha_venta", DESCENDING)], name="fecha_venta_-1"),
        IndexModel(
            [("sucursal.region_id", ASCENDING), ("fecha_venta", DESCENDING)],
            name="sucursal.region_id_1_fecha_venta_-1",
        ),
        IndexModel([("items.corte_id", ASCENDING)], name="items.corte_id_1"),
        IndexModel(
            [("estatus", ASCENDING), ("fecha_venta", DESCENDING)],
            name="estatus_1_fecha_venta_-1",
        ),
        IndexModel([("updatedAt", DESCENDING)], name="updatedAt_-1"),
    ]
    return collection.create_indexes(indices)


def documento_para_json(documento: dict[str, Any]) -> dict[str, Any]:
    """Convierte ObjectId y fechas para mostrar un ejemplo legible."""
    resultado = {}
    for clave, valor in documento.items():
        if isinstance(valor, ObjectId):
            resultado[clave] = str(valor)
        elif isinstance(valor, datetime):
            resultado[clave] = valor.isoformat()
        elif isinstance(valor, dict):
            resultado[clave] = documento_para_json(valor)
        elif isinstance(valor, list):
            resultado[clave] = [
                documento_para_json(item) if isinstance(item, dict) else item
                for item in valor
            ]
        else:
            resultado[clave] = valor
    return resultado


def insertar_ventas(collection, fake: Faker, catalogos: dict[str, list[dict[str, Any]]]) -> tuple[int, str]:
    inicio = time.perf_counter()
    ahora = datetime.now(timezone.utc)
    prefijo_folio = f"PY5000-{ahora:%Y%m%d%H%M%S}-{uuid.uuid4().hex[:6].upper()}"
    insertados = 0
    lote: list[dict[str, Any]] = []

    for consecutivo in range(1, CANTIDAD_DOCUMENTOS + 1):
        lote.append(
            crear_documento_venta(
                fake,
                catalogos,
                prefijo_folio,
                consecutivo,
            )
        )

        if len(lote) == TAMANIO_LOTE:
            resultado = collection.insert_many(lote, ordered=False)
            insertados += len(resultado.inserted_ids)
            print(f"Lote completado: {insertados:,}/{CANTIDAD_DOCUMENTOS:,} documentos insertados.")
            lote.clear()

    if lote:
        resultado = collection.insert_many(lote, ordered=False)
        insertados += len(resultado.inserted_ids)

    segundos = time.perf_counter() - inicio
    cantidad_generada = collection.count_documents(
        {"folio": {"$regex": f"^{re.escape(prefijo_folio)}-"}}
    )
    if insertados != CANTIDAD_DOCUMENTOS or cantidad_generada != CANTIDAD_DOCUMENTOS:
        raise RuntimeError(
            "La verificación no alcanzó exactamente 5,000 documentos: "
            f"insertados={insertados}, encontrados={cantidad_generada}."
        )

    print(f"Verificación correcta: {cantidad_generada:,} documentos de esta ejecución.")
    print(f"Tiempo de generación e inserción: {segundos:.2f} segundos.")
    return insertados, prefijo_folio


def main() -> None:
    args = obtener_argumentos()
    fake = Faker(IDIOMA_FAKER)
    if args.semilla is not None:
        fake.seed_instance(args.semilla)

    client = MongoClient(
        args.uri,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=5_000,
    )
    inicio_total = time.perf_counter()
    try:
        client.admin.command("ping")
        db = obtener_base(client, args.db)
        catalogos = cargar_catalogos(db)
        collection = db[COLECCION_PRINCIPAL]

        print(f"MongoDB conectado. Base: {db.name}. Colección: {COLECCION_PRINCIPAL}.")
        print(
            "Catálogos reutilizados: "
            f"{len(catalogos['clientes'])} clientes, "
            f"{len(catalogos['sucursales'])} sucursales y "
            f"{len(catalogos['cortes'])} cortes."
        )

        if args.dry_run:
            ejemplo = crear_documento_venta(fake, catalogos, "PY5000-EJEMPLO", 1)
            print("Dry run: no se insertaron documentos ni se crearon índices.")
            print(json.dumps(documento_para_json(ejemplo), ensure_ascii=False, indent=2))
            return

        insertar_ventas(collection, fake, catalogos)
        nombres_indices = crear_indices_ventas(collection)
        print("Índices creados/verificados:")
        for nombre in nombres_indices:
            print(f"  - {nombre}")

        print(f"Proceso terminado en {time.perf_counter() - inicio_total:.2f} segundos.")
    finally:
        client.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Error al poblar MongoDB: {error}")
        raise SystemExit(1)
