import re, csv, json, sys
D = sys.argv[1]  # data dir
REG = re.compile(r'\b(PNOE\d{3}[A-Z]{2}|PNPOE0\d{3}[A-Z]{2}|[A-Z]{2,5}OE\d{3}[A-Z]{2})\b')
SER = re.compile(r'^(\d{1,3})\.(?:\s+(.*))?$')
NOISE = re.compile(r'^(\[|\d+\s+THE GAZETTE|THE GAZETTE|S\.?$|No\.?$|Obligated|Baseline|\(\d|\(a\)|Name, |Registration|Number$|\(Tonne|\(tCO|Compliance|Year|20\d\d|Intensity|Target|GHG|Product|Output|Equivalent|Major|Crude|Throughpt|NRGF|Factor|\(MBBLS|MBBLS|/MBBLS|Emission|Table\s*\d|Sector|Sub[ -]?[Ss]ector|ector\s*[-–]|equivalent|tonne|/Tonne|product\)|\(5\)|\(6\)|\(1\)|\(2\)|\(3\)|\(4\)|\(b\))')
HDR = re.compile(r'^(Table\s*\d|Sector|Sub[ -]?[Ss]ector|ector\s*[-–]|THE (FIRST|SECOND) SCHEDULE)')

def parse(path, start_marker):
    lines = open(path, encoding='utf-8').read().split('\n')
    start = [i for i, l in enumerate(lines) if start_marker in l][-1]
    blocks, cur, exp, hdr = [], None, {1}, False
    for raw in lines[start:]:
        s = raw.strip()
        if not s: continue
        m = SER.match(s)
        if m and (int(m.group(1)) in exp or (int(m.group(1)) == 1 and hdr)):
            cur = {'serial': int(m.group(1)), 'lines': []}
            blocks.append(cur); exp.discard(cur['serial']); exp.add(cur['serial'] + 1); hdr = False
            if m.group(2): cur['lines'].append(m.group(2).strip())
            continue
        if HDR.match(s):
            hdr = True; continue
        if NOISE.match(s): continue
        if cur is None: continue
        if hdr and not re.fullmatch(r'\d{5,6}', s):
            continue  # after a table header only a bare pincode continues the previous row
        cur['lines'].append(s)
    out = {}
    for b in blocks:
        name_parts, reg = [], None
        for l in b['lines']:
            m = REG.search(l)
            if m and reg is None:
                reg = m.group(1)
                pre = l[:m.start()].strip(' ,')
                if pre: name_parts.append(pre)
            elif m:
                continue
            else:
                name_parts.append(l)
        if reg is None: continue
        reg = reg.replace('PNOE', 'PNPOE') if reg.startswith('PNOE') else reg
        if reg.startswith('PNPOE0') and len(reg) == 11: reg = 'PNPOE' + reg[6:]
        name = re.sub(r'\s+', ' ', ' '.join(name_parts)).strip()
        name = re.split(r'\s+(?:Note\s?\d?:|\d\.\s+In the principal|Uploaded by|\[F\. No)', name)[0].strip()
        out[reg] = {'name': name, 'serial': b['serial']}
    return out, len(blocks)

oct_, n1 = parse(f'{D}/raw/raw.txt', 'SCHEDULE')
jan_, n2 = parse(f'{D}/raw/jan_raw.txt', 'THE SECOND SCHEDULE')
print('blocks', n1, n2, 'regs', len(oct_), len(jan_))
rows = list(csv.DictReader(open(f'{D}/entities.csv', encoding='utf-8')))
diff = []
for r in rows:
    new = (oct_.get(r['reg_no']) or jan_.get(r['reg_no']) or {}).get('name')
    if new is None: diff.append((r['reg_no'], 'MISSING', '', r['name_address'])); continue
    a = re.sub(r'\W+', '', r['name_address']).lower(); b = re.sub(r'\W+', '', new).lower()
    if a != b: diff.append((r['reg_no'], 'DIFF', new, r['name_address']))
print('entities', len(rows), 'differences', len(diff))
json.dump({k: v['name'] for k, v in {**oct_, **jan_}.items()}, open(f'{D}/names_reparsed.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
for d in diff[:14]:
    print('---', d[0], d[1]); print('  NEW:', d[2][:160]); print('  OLD:', d[3][:160])
