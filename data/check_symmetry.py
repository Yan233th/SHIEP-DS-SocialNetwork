# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "pandas>=2.3.3",
# ]
#
# [[tool.uv.index]]
# url = "https://mirror.sjtu.edu.cn/pypi/web/simple"
# default = true
# ///
import pandas as pd

def check_edges():
    # 读取文件
    filename = 'stackoverflow_edges.csv'
    try:
        df = pd.read_csv(filename)
    except FileNotFoundError:
        print(f"错误：找不到文件 '{filename}'，请确认文件路径正确。")
        return
    # 创建一个包含所有边的集合 (source, target)
    # 使用 set 查询速度最快
    edges_set = set(zip(df['source'], df['target']))
    
    # 用来存储没有反向边的记录
    one_way_edges = []
    # 遍历每一行进行检查
    for index, row in df.iterrows():
        source = row['source']
        target = row['target']
        
        # 检查反向边 (target -> source) 是否存在于集合中
        reverse_edge = (target, source)
        
        if reverse_edge not in edges_set:
            one_way_edges.append((source, target))
    # 输出结果
    print(f"数据总条数: {len(df)}")
    
    if len(one_way_edges) == 0:
        print("✅ 检查通过：所有的边都是双向的（这是一个无向图）。")
        print("这意味着如果存在 A->B，那么一定存在 B->A。")
    else:
        print(f"❌ 检查发现：并不是所有边都是双向的。")
        print(f"发现 {len(one_way_edges)} 条边是单向的（没有对应的返回边）。")
        print("以下是前 5 个单向边示例：")
        for edge in one_way_edges[:5]:
            print(f"{edge[0]} -> {edge[1]}")
            
if __name__ == "__main__":
    check_edges()
