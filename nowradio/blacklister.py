import sys
from dbManager import Queries, get_connection
import ourUtils


def main():
    if len(sys.argv) != 2:
        print("usage: python " + sys.argv[0] + " [ip address to be blacklisted]")
        return
    station_ip = sys.argv[1]
    conn = get_connection()
    ourUtils.db_quick_query(conn, Queries.set_station_blacklisted, (station_ip,))
    conn.close()
    print("success")

if __name__ == '__main__':
    main()