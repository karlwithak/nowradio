import psycopg2
import model
from dbManager import Queries, dbpass


def main():
    conn = None
    try:
        conn = psycopg2.connect("dbname=radiodb user=radiodb host=localhost password=%s" % dbpass)
    except psycopg2.DatabaseError:
        print("could not connect to db")
        exit("could not connect to db")
    curr = conn.cursor()
    for i in range(len(model.genre_list)):
        data = {
            'our_genre': model.genre_names[i],
            'genre_names': model.genre_list[i]
        }
        curr.execute(Queries.set_our_genre_by_genre, data)
    curr.close()
    conn.commit()
    conn.close()

if __name__ == '__main__':
    main()