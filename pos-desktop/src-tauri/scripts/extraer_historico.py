import re
import sys

DUMP = r"C:\Repositorios\SistemaPOS\DataBase\pos_system (7).sql"
OUT = r"C:\Repositorios\SistemaPOS\pos-desktop\src-tauri\seed_historico.sql"

TABLES = ["conceptos_operaciones", "turnos", "ventas", "pedidos", "operaciones"]

with open(DUMP, "r", encoding="utf8") as f:
    text = f.read()

out_parts = []

for table in TABLES:
    pattern = re.compile(
        r"INSERT INTO `" + re.escape(table) + r"` \([^)]*\) VALUES\n(.*?);\n",
        re.DOTALL,
    )
    matches = pattern.findall(text)
    if not matches:
        print(f"WARNING: no INSERT found for {table}", file=sys.stderr)
        continue
    header_match = re.search(r"INSERT INTO `" + re.escape(table) + r"` \([^)]*\)", text)
    header = header_match.group(0)
    values = ",\n".join(m.strip().rstrip(",") for m in matches)
    stmt = f"{header} VALUES\n{values};\n"
    if table == "operaciones":
        # nuestro esquema usa 'Egreso' en vez de 'Salida' para el tipo de operación
        stmt = re.sub(r"(\(\d+, )'Salida'", r"\1'Egreso'", stmt)
    out_parts.append(stmt)

with open(OUT, "w", encoding="utf8") as f:
    f.write("\n".join(out_parts))

print(f"Escrito {OUT}")
for table in TABLES:
    n = sum(1 for p in out_parts if p.startswith(f"INSERT INTO `{table}`"))
    print(f"  {table}: {'OK' if n else 'FALTA'}")
