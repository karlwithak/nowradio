from dbManager import Queries, dbpass
import psycopg2
import socket
import ourUtils


def main():
    conn = psycopg2.connect("dbname=radiodb user=radiodb host=localhost password=%s" % dbpass)
    cur = conn.cursor()
    cur.execute(Queries.get_all_urls)
    id_url_list = cur.fetchall()
    for id_url in id_url_list:
        try:
            ip = ourUtils.ip_from_url(id_url[1])
        except socket.gaierror:
            print("socket error on " + id_url[1])
        else:
            cur.execute(Queries.set_ip_for_id, [ip, id_url[0]])
    cur.close()
    conn.commit()
    conn.close()

if __name__ == '__main__':
    main()