import json, math, re
from pathlib import Path
from urllib.request import urlretrieve
import pandas as pd

ROOT=Path(__file__).parent
xls=ROOT/'data'/'raw'/'moi_population_age_2025.xls'
if not xls.exists():
    xls.parent.mkdir(parents=True, exist_ok=True)
    source_url='https://www.ris.gov.tw/info-popudata/app/awFastDownload/file/y0s1-00000.xls/y0s1/00000/'
    print('downloading population source', source_url)
    urlretrieve(source_url, xls)
df=pd.read_excel(xls,sheet_name='114',header=None)
exclude={'總計','臺灣省','福建省'}
people={}
for i,row in df.iterrows():
    if str(row[1]).strip()!='男': continue
    name=re.sub(r'\s+','',str(row[0]))
    if name in exclude or not name.endswith(('市','縣')): continue
    prev=df.iloc[i-1]
    female=df.iloc[i+1]
    total=int(prev[2]); male=int(row[2]); fem=int(female[2])
    child=int(prev[3])+int(prev[4])+int(prev[9])+int(prev[10])
    working=sum(int(prev[j]) for j in range(11,21))
    senior=sum(int(prev[j]) for j in range(21,29))
    assert total==male+fem==child+working+senior,(name,total,male+fem,child+working+senior)
    people[name]={
      'population':total,'male':male,'female':fem,
      'age':{'child':child,'working':working,'senior':senior},
      'agePct':{'child':round(child/total*100,2),'working':round(working/total*100,2),'senior':round(senior/total*100,2)}
    }

party={
'臺北市':[37.53,33.36,21.83],'新北市':[35.13,34.81,22.90],'基隆市':[39.48,31.01,22.40],
'宜蘭縣':[30.06,41.02,22.26],'桃園市':[35.56,32.14,25.32],'新竹縣':[39.31,23.59,28.78],
'新竹市':[31.63,30.20,29.35],'苗栗縣':[43.18,25.32,23.27],'臺中市':[34.21,33.74,24.73],
'彰化縣':[35.08,34.58,23.45],'南投縣':[40.66,32.66,20.23],'雲林縣':[31.95,40.77,20.82],
'嘉義縣':[29.46,44.20,19.05],'嘉義市':[32.35,39.07,21.48],'臺南市':[26.83,45.97,19.38],
'高雄市':[30.61,44.90,17.46],'屏東縣':[32.78,44.40,16.42],'臺東縣':[52.23,24.17,16.95],
'花蓮縣':[52.85,21.45,19.57],'澎湖縣':[38.42,36.24,19.49],'金門縣':[63.79,7.97,21.70],
'連江縣':[64.12,7.96,21.97]
}
eth_rows=[
('基隆市',[6.8,0.5,70.1,9.7,2.1,8.5,0.3,2.1]),('臺北市',[11.4,0.7,60.3,13.5,1.0,10.7,1.1,1.4]),
('新北市',[9.4,0.8,67.5,8.9,1.0,9.7,1.1,1.6]),('桃園市',[32.5,1.5,51.3,8.2,1.5,3.3,0.7,1.0]),
('新竹縣',[61.3,1.6,26.0,3.4,3.1,2.3,1.3,1.1]),('新竹市',[22.4,1.9,62.3,6.6,1.4,3.8,0.4,1.1]),
('苗栗縣',[54.3,1.3,36.7,2.1,1.4,2.2,1.5,0.6]),('臺中市',[11.2,0.7,69.8,6.3,1.5,8.2,0.8,1.5]),
('彰化縣',[4.6,0.7,78.2,4.9,0.6,9.8,0.3,1.0]),('南投縣',[10.0,0.5,75.4,3.6,2.5,6.1,0.8,1.0]),
('雲林縣',[5.1,0.2,81.5,2.4,0.5,8.4,0.3,1.7]),('嘉義縣',[4.8,0.5,79.5,3.5,0.7,8.7,0.2,2.0]),
('嘉義市',[3.9,1.4,76.5,4.0,0.4,11.3,0.6,1.9]),('臺南市',[3.7,0.2,76.6,4.0,1.1,12.4,0.5,1.4]),
('高雄市',[7.5,0.3,71.7,7.1,1.2,9.9,0.7,1.5]),('屏東縣',[18.3,0.4,65.7,3.6,5.5,4.8,0.5,1.1]),
('宜蘭縣',[3.2,0.6,79.3,3.5,2.0,8.2,1.6,1.6]),('花蓮縣',[24.6,0.9,44.4,5.5,19.0,3.3,1.5,0.7]),
('臺東縣',[13.6,0.3,53.5,5.5,21.8,3.6,1.2,0.5]),('澎湖縣',[3.2,None,76.7,7.7,1.0,7.0,3.1,1.4]),
('金門縣',[3.8,None,78.8,3.2,0.5,4.0,8.8,0.8]),('連江縣',[0.5,None,68.2,11.7,3.3,7.4,8.0,0.9])]
regions={'基隆市':'北部','臺北市':'北部','新北市':'北部','桃園市':'北部','新竹縣':'北部','新竹市':'北部','宜蘭縣':'北部',
'苗栗縣':'中部','臺中市':'中部','彰化縣':'中部','南投縣':'中部','雲林縣':'中部','嘉義縣':'南部','嘉義市':'南部','臺南市':'南部','高雄市':'南部','屏東縣':'南部','花蓮縣':'東部','臺東縣':'東部','澎湖縣':'離島','金門縣':'離島','連江縣':'離島'}
eth={}
for n,r in eth_rows:
    eth[n]={
      'minnan':r[2], 'hakka': None if r[1] is None else round(r[0]+r[1],1),
      'mainlander':r[3], 'indigenous':r[4], 'other':round(sum(v or 0 for v in r[5:]),1),
      'complete':all(v is not None for v in r)
    }

counties=[]
for name in sorted(people, key=lambda n: -people[n]['population']):
    assert name in party and name in eth, name
    counties.append({'name':name,'region':regions[name],**people[name],
      'party':{'kmt':party[name][0],'dpp':party[name][1],'tpp':party[name][2]},
      'ethnicity':eth[name]})
assert len(counties)==22
assert sum(c['population'] for c in counties)==23299132
for c in counties:
    assert c['population']==c['male']+c['female']==sum(c['age'].values())

out={
 'meta':{'populationDate':'2025-12-31','electionDate':'2024-01-13','pollDate':'2026-06-22～24','ethnicityYear':2014},
 'nationalPoll':{
   'sample':1078,'margin':'±3.0%','method':'住宅電話＋行動電話 CATI',
   'kmt':{'support':17.9,'favor':29.9,'unfavor':51.1},
   'dpp':{'support':30.4,'favor':40.8,'unfavor':45.6},
   'tpp':{'support':7.0,'favor':23.7,'unfavor':55.8}
 },
 'nationalElection':{'kmt':34.58,'dpp':36.16,'tpp':22.07},
 'counties':counties
}
(ROOT/'dist'/'data.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print('counties',len(counties),'population',sum(c['population'] for c in counties))
print('age sum',sum(c['age']['child'] for c in counties),sum(c['age']['working'] for c in counties),sum(c['age']['senior'] for c in counties))
