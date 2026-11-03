import re,csv
raw=open('raw/jan_raw.txt',encoding='utf-8').read().split('\n')
start=next(i for i,l in enumerate(raw) if 'THE SECOND SCHEDULE' in l and i>20)
reg=re.compile(r'^(.*?)\b([A-Z]{3,4}OE\d{3}[A-Z]{2}|PCOE\d{3}[A-Z]{2})\s*(.*)$')
SEC={'ALM':'Aluminium','REF':'Petroleum Refinery','PCO':'Petrochemical','TXT':'Textile'}
rows=[];sub='';buf=[]
for l in raw[start:]:
    s=l.strip()
    if re.match(r'^Sub-?\s?[Ss]ector\s*[-–:]',s) or re.match(r'^(Sub\s*-\s*Sector|ector)\s*[-–:]',s) or re.match(r'^Sector\s*[-–:]\s*(Fibre|Composite)',s):
        sub=re.sub(r'^.*?[-–:]\s*','',s); buf=[]; continue
    if re.match(r'^Sector\s*[:-]',s): buf=[]; continue
    m=reg.match(s)
    if m:
        if m.group(1).strip(): buf.append(m.group(1).strip())
        t=m.group(3).split()
        if not t:  # numbers on next line(s); handled by pending
            pend=(m.group(2),re.sub(r'^\d+\.\s*','',' '.join(buf))); buf=[]; rows.append(['PEND',*pend]); continue
        rows.append([m.group(2),re.sub(r'^\d+\.\s*','',' '.join(buf)),sub,t]); buf=[]
    elif rows and rows[-1][0]=='PEND' and re.match(r'^[\d.,\-]+( |$)',s):
        _,rid,nm=rows.pop(); rows.append([rid,nm,sub,s.split()])
    elif s and not re.match(r'^(\[|\d+ THE GAZETTE|S\.|No|Obligated|Baseline|\(\d|Name,|Registration|\(Tonne|Compliance|Year|20\d\d|Intensity|Target|GHG|Product|Output|Equivalent|Major|Crude|NRGF|Factor|Throughpt|\(MBBLS|MBBLS|/MBBLS|\(tCO)',s):
        buf.append(s)
out=[];bad=[]
for r in rows:
    rid,nm,sb,t=r; t=[x.replace(',','') for x in t]
    pre=rid[:3]; unit='MBBLS' if pre=='REF' else 'tonne'
    nrgf=None
    if pre=='REF':
        if len(t)!=5: bad.append(rid); continue
        nrgf=t[1]; t=[t[0]]+t[2:]
    if len(t)!=4: bad.append(rid); continue
    t=[None if x in('-','–') else x for x in t]
    out.append([rid,nm,SEC[pre],sb if pre!='REF' else 'Refinery',unit,*t,nrgf,'gazette 13 Jan 2026 G.S.R. 25(E)'])
w=csv.writer(open('entities_jan2026.csv','w',newline='',encoding='utf-8'))
w.writerow(['reg_no','name_address','sector','sub_sector','output_unit','baseline_output','baseline_intensity','target_2025_26','target_2026_27','nrgf','source'])
w.writerows(out)
print(len(out),'ok; bad:',bad)
from collections import Counter; print(Counter((r[2],r[3]) for r in out))
