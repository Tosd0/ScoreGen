import csv
import argparse
from collections import Counter
import os

def count_referee_appearances(csv_file_path):
    """
    从CSV文件中读取数据，统计每个裁判在“已结束”比赛中的出现次数。

    Args:
        csv_file_path (str): 输入的CSV文件路径。

    Returns:
        collections.Counter: 一个包含裁判姓名及其出现次数的Counter对象。
        None: 如果文件未找到或发生其他错误。
    """
    if not os.path.exists(csv_file_path):
        print(f"错误: 文件未找到 -> '{csv_file_path}'")
        return None

    referee_counts = Counter()
    
    try:
        with open(csv_file_path, mode='r', encoding='utf-8-sig') as infile:
            reader = csv.reader(infile)
            
            # 跳过表头
            try:
                header = next(reader)
            except StopIteration:
                print("错误: CSV文件为空。")
                return None # 文件为空

            # 获取列索引，增加灵活性
            try:
                status_col_index = header.index('比赛状态') # 假设E列标题是'比赛状态'
                referee_col_index = header.index('裁判')   # 假设G列标题是'裁判'
            except ValueError as e:
                print(f"错误: CSV文件缺少必要的列标题: {e}。将使用默认索引 E(5) 和 G(7)。")
                status_col_index = 4  # E列
                referee_col_index = 6 # G列


            for i, row in enumerate(reader, 1):
                try:
                    # 检查E列是否为“已结束”
                    if row[status_col_index].strip() == '已结束':
                        # 获取G列的裁判名
                        referees_str = row[referee_col_index].strip()
                        if referees_str:
                            # 按逗号分割，并去除每个名字前后的空格
                            referees_list = [name.strip() for name in referees_str.split(',')]
                            referee_counts.update(referees_list)

                except IndexError:
                    print(f"警告: 第 {i+1} 行的列数不足，已跳过。")
                    continue

    except Exception as e:
        print(f"处理文件时发生错误: {e}")
        return None

    return referee_counts

def main():
    """
    主函数，用于解析命令行参数并调用核心处理函数。
    """
    parser = argparse.ArgumentParser(description='统计CSV文件中“已结束”比赛的裁判执裁次数。')
    parser.add_argument('csv_file', type=str, help='要处理的CSV文件路径。')
    
    args = parser.parse_args()
    
    counts = count_referee_appearances(args.csv_file)
    
    if counts:
        if not counts:
            print("没有找到任何“已结束”的比赛记录或裁判信息。")
            return

        print("裁判执裁次数统计结果：")
        # 排序并打印结果
        for referee, count in sorted(counts.items(), key=lambda item: item[1], reverse=True):
            print(f"- {referee}: {count} 次")

if __name__ == '__main__':
    main()
