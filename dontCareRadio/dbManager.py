dbpass = "VG9kYXkgaXMgYSBsb3ZlbHkgZGF5LCBpc24ndCBpdD8K"  # TODO hide?


class Queries:
    def __init__(self):
        pass

    insert_station = '''
        INSERT INTO station_info
        (url, active_listeners, max_listeners, peak_listeners, name, genre, ip_addr, is_up)
        VALUES (%(url)s, %(active)s, %(max)s, %(peak)s, %(name)s, %(genre)s, %(ip)s, TRUE);
    '''
    check_for_station = '''
        SELECT 1
        FROM station_info
        WHERE url = %s
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
    get_urls_by_genre = '''
        SELECT ip_addr
        FROM station_info
        WHERE our_genre = %(genre_name)s AND is_up = TRUE
        GROUP BY ip_addr, name
        ORDER BY max(active_listeners) DESC
        LIMIT %(page_size)s
        OFFSET %(page_number)s
    '''
    set_our_genre_by_genre = '''
        UPDATE station_info
        SET our_genre = %(our_genre)s
        WHERE genre ILIKE ANY(%(genre_names)s)
    '''
    get_all_urls = '''
        SELECT id, url
        FROM station_info
    '''
    set_ip_for_id = '''
        UPDATE station_info
        SET (ip_addr) = (%s)
        WHERE id = %s
    '''
