from stationFinder import our_genre_setter
import dbManager
# updates the our_genre column for each station
# RUN THIS SCRIPT EVERY TIME MODEL.PY IS CHANGED IN ORDER FOR CHANGES TO TAKE EFFECT


def main():
    conn = dbManager.get_connection()
    our_genre_setter(conn)
    conn.commit()
    conn.close()

if __name__ == '__main__':
    main()