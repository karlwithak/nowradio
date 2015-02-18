from logging import FileHandler
from flask import Flask, render_template, request, jsonify
import psycopg2
import logging
# This file is the first that is called when someone goes to a page on our website.
# It looks at the url that they entered and decides what computation to do and what
#   template to show them.

app = Flask(__name__)

app.config['APP_NAME'] = "Don't Care Radio"
app.config.from_pyfile('conf/flask.conf.py')
file_handler = FileHandler('/var/log/flask/info.log')
file_handler.setLevel(logging.INFO)
app.logger.addHandler(file_handler)
dbpass = "VG9kYXkgaXMgYSBsb3ZlbHkgZGF5LCBpc24ndCBpdD8K"  # TODO hide?
request_header = {'User-Agent': 'Mozilla/5.0'}
page_size = 10
get_urls_by_genre = "SELECT max(url) " \
                    "FROM station_info " \
                    "WHERE name ILIKE %(genre_name)s OR genre ILIKE %(genre_name)s " \
                    "GROUP BY name, genre " \
                    "ORDER BY max(active_listeners) DESC " \
                    "LIMIT %(page_size)s " \
                    "OFFSET %(page_number)s;"

try:
    db_conn = psycopg2.connect("dbname=radiodb user=radiodb host=localhost password=%s" % dbpass)
except psycopg2.DatabaseError:
    app.logger.error("could not connect to db!")


@app.route('/')
def render_landing():
    return render_template("player.html")


@app.route('/get-stations/')
def get_stations():
    db_cur = db_conn.cursor()
    app.logger.info("%s, %s", request.args.get('genre', ''), request.args.get('page', ''))
    data = {
        'genre_name':  "%" + request.args.get('genre', '') + "%",
        'page_number': page_size * int(request.args.get('page', '')),
        'page_size':   page_size
    }
    db_cur.execute(get_urls_by_genre, data)
    results = db_cur.fetchall()
    app.logger.info(str(results))
    return jsonify(stations=results)

if __name__ == '__main__':
    app.run()
