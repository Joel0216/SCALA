import pandas as pd
try:
    df = pd.read_excel(r'C:\Users\PC05\Downloads\Scala\Scala tablas\TipoDeExamen.xls')
    print(df.to_dict('records'))
except Exception as e:
    print(str(e))
