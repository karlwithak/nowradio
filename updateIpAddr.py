from dbManager import Queries, dbpass
import psycopg2
import socket


def main():
    conn = psycopg2.connect("dbname=radiodb user=radiodb host=localhost password=%s" % dbpass)
    cur = conn.cursor()
    cur.execute(Queries.get_all_urls)
    id_url_list = cur.fetchall()
    for id_url in id_url_list:
        hostname = id_url[1].replace("http://", "")[:-1]
        if ":" in hostname:
            hostname = hostname[:hostname.index(":")]
        ip = socket.gethostbyname(hostname)
        cur.execute(Queries.set_ip_for_id, [ip, id_url[0]])
    cur.close()
    conn.commit()
    conn.close()

if __name__ == '__main__':
    main()