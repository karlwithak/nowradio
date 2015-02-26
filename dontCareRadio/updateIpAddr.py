import socket
import psycopg2
from dbManager import Queries, dbpass
import ourUtils


def worker(id_url_list, conn):
    cur = conn.cursor()
    for id_url in id_url_list:
        try:
            ip = ourUtils.ip_from_url(id_url[1])
        except socket.gaierror:
            print("socket error on " + id_url[1])
        else:
            cur.execute(Queries.check_for_station, (ip,))
            if cur.rowcount != 1:
                cur.execute(Queries.set_ip_for_id, [ip, id_url[0]])
    cur.close()


def main():
    conn = psycopg2.connect("dbname=radiodb user=radiodb host=localhost password=%s" % dbpass)
    id_url_list = ourUtils.db_quick_query(conn, Queries.get_all_urls)
    ourUtils.multi_thread_runner(id_url_list, worker, conn)
    conn.commit()
    conn.close()

if __name__ == '__main__':
    main()