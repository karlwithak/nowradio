from dbManager import Queries, get_connection
import ourUtils


def insert_locations_by_ip(conn, location_tuples):
    for location in location_tuples:
        data = {
            'ip': location[0],
            'latitude': location[1][0],
            'longitude': location[1][1]
        }
        ourUtils.db_quick_query(
            conn,
            Queries.insert_location_for_ip,
            data
        )


def get_location_tuples(ip_list):
    return [(ip, ourUtils.location_from_ip(ip.split(':')[0])) for ip in ip_list]


def get_and_insert_locations(ip_list, conn):
    location_tuples = get_location_tuples(ip_list)
    insert_locations_by_ip(conn, location_tuples)


def get_ip_list(conn):
    # Returns a list of ips.
    count = ourUtils.db_quick_query(conn, Queries.get_total_rows)
    total_rows = count[0][0]
    batch_size = 500
    offset = 0
    ip_list = []
    while offset < total_rows:
        data = {
            'batch_size': batch_size,
            'offset': offset
        }
        batch_ips = ourUtils.db_quick_query(
            conn,
            Queries.get_batch_ips,
            data
        )
        ips = [ip[0] for ip in batch_ips]
        offset += batch_size
        ip_list += ips
    return ip_list


def main():
    conn = get_connection()
    ip_list = get_ip_list(conn)
    ourUtils.multi_thread_runner(ip_list, get_and_insert_locations, conn)

if __name__ == '__main__':
    main()
