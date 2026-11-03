import re,csv
raw=open('raw/raw.txt',encoding='utf-8').read().split('\n')
start=[i for i,l in enumerate(raw) if 'SCHEDULE' in l][-1]
reg=re.compile(r'^(.*?)\b(PNOE\d{3}[A-Z]{2}|PNPOE0\d{3}[A-Z]{2}|[A-Z]{5}\d{3}[A-Z]{2})\s+(.*)$')
SEC={'ALM':'Aluminium','CMT':'Cement','CGU':'Cement','CNA':'Chlor-Alkali','PNP':'Pulp and Paper'}
rows=[];sub='';buf=[]
for l in raw[start:]:
    s=l.strip()
    ub=re.match(r'^Sub-?\s?[Ss]ector\s*[-:]\s*(.+)',s)
    if ub: sub=ub.group(1).strip(); buf=[]; continue
    if s.startswith('Sector') and re.match(r'^Sector\s*[-:]',s): buf=[]; continue
    m=reg.match(s)
    if m and len(m.group(3).split())>=3:
        if m.group(1).strip(): buf.append(m.group(1).strip())
        t=[x.replace(',','') for x in m.group(3).split()]
        name=re.sub(r'^\d+\.\s*','',' '.join(buf))
        rid=m.group(2).replace('PNOE','PNPOE') if m.group(2).startswith('PNOE') else m.group(2)
        rid='PNPOE'+rid[6:] if rid.startswith('PNPOE0') and len(rid)==11 else rid
        rows.append([rid,name,SEC[rid[:3]],sub,t[0],*(None if x in'-–' else x for x in t[1:4])] if len(t)>=4 else [m.group(2),name,SEC[rid[:3]],sub]+t)
        buf=[]
    elif s and not re.match(r'^(\[|\d+ THE GAZETTE|Table|\(\d)',s) and 'GAZETTE' not in s:
        buf.append(s)
w=csv.writer(open('entities_draft.csv','w',newline='',encoding='utf-8'))
w.writerow(['reg_no','name_address','sector','sub_sector','baseline_output_t','baseline_intensity','target_2025_26','target_2026_27'])
bad=[r for r in rows if len(r)!=8 or r[5] is None]
for r in rows: w.writerow(r)
print(len(rows),'rows; need review:',[r[0] for r in bad])
from collections import Counter; print(Counter(r[2] for r in rows))
