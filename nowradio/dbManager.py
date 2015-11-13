import psycopg2
import serverInfo


def get_connection():
    try:
        return psycopg2.connect("dbname=%s user=%s host=%s password=%s" %
                                (serverInfo.db_name, serverInfo.db_user,
                                 serverInfo.db_host, serverInfo.db_pass))
    except psycopg2.DatabaseError as e:
        print("could not connect to db: " + str(e))
        return None


class Queries:
    def __init__(self):
        pass

    # Our SQL queries

    insert_station = '''
        INSERT INTO station_info
        (active_listeners, max_listeners, peak_listeners, name, genre, ip_addr, is_up, blacklisted, timeout_count)
        VALUES (%(active)s, %(max)s, %(peak)s, %(name)s, %(genre)s, %(ip)s, TRUE, FALSE, 0);
    '''
    check_for_station = '''
        SELECT 1
        FROM station_info
        WHERE ip_addr = %s
    '''
    get_highest_id = '''
        SELECT id
        FROM station_info
        ORDER BY id DESC
        LIMIT 1
    '''
    update_station_by_id = '''
        UPDATE station_info
        SET (active_listeners, max_listeners, peak_listeners, last_updated, is_up)
            = (%(active)s, %(max)s, %(peak)s, NOW(), %(is_up)s)
        WHERE id = %(id)s
    '''
    set_station_down = '''
        UPDATE station_info
        SET is_up = FALSE
        WHERE id = %s
    '''
    set_station_blacklisted = '''
        UPDATE station_info
        SET blacklisted = TRUE
        WHERE ip_addr = %s
    '''
    get_good_ips_by_genre = '''
        SELECT min(ip_addr)
        FROM station_info
        WHERE our_genre = %(genre_name)s AND is_up AND NOT blacklisted
        GROUP BY name
        ORDER BY max((%(active_weight)s * active_listeners) + (%(faves_weight)s * faves) - (%(timeout_weight)s * timeout_count)) DESC
        LIMIT %(page_size)s
    '''
    set_our_genre_by_genre = '''
        UPDATE station_info
        SET our_genre = %(our_genre)s
        WHERE genre ILIKE ANY(%(genre_names)s)
    '''
    set_our_genre_null = '''
        UPDATE station_info
        SET our_genre = NULL
    '''
    get_all_ips = '''
        SELECT id, ip_addr
        FROM station_info
    '''
    set_ip_for_id = '''
        UPDATE station_info
        SET (ip_addr) = (%s)
        WHERE id = %s
    '''
    get_our_genre_by_ip = '''
        SELECT our_genre
        FROM station_info
        WHERE ip_addr = %s
    '''
    update_fave_increase = '''
        UPDATE station_info
        SET faves = faves + 1
        WHERE ip_addr = %s
    '''
    update_fave_decrease = '''
        UPDATE station_info
        SET faves = faves - 1
        WHERE ip_addr = %s
    '''
    report_timeout = '''
        UPDATE station_info
        SET timeout_count = timeout_count + 1
        WHERE ip_addr = %s
    '''
