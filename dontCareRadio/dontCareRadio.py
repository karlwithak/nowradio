from logging import FileHandler
import logging
from flask import Flask, render_template, request, jsonify
import psycopg2
from dbManager import Queries, dbpass
import model
import ourUtils

# This file is the first that is called when someone goes to a page on our website.
# It looks at the url that they entered and decides what computation to do and what
#   template to show them.

app = Flask(__name__, template_folder="../templates")

app.config['APP_NAME'] = "Don't Care Radio"
app.config.from_pyfile('../conf/flask.conf.py')
file_handler = FileHandler('/var/log/flask/info.log')
file_handler.setLevel(logging.INFO)
app.logger.addHandler(file_handler)
page_size = 100


try:
    db_conn = psycopg2.connect("dbname=radiodb user=radiodb host=localhost password=%s" % dbpass)
except psycopg2.DatabaseError:
    app.logger.error("could not connect to db!")


@app.route('/')
def render_landing():
    return render_template("player.html")


@app.route('/get-initial-stations/')
def get_initial_stations():
    cur = db_conn.cursor()
    stations = []
    data = {'page_size': page_size}
    for genre in model.genre_names:
        data['genre_name'] = genre
        cur.execute(Queries.get_ips_by_genre, data)
        result = ourUtils.flatten_list(cur.fetchall())
        stations.append(result)
    return jsonify(stations=stations)


@app.route('/get-genre-by-ip/')
def get_genre_by_ip():
    ip = request.args.get('ip', '')
    results = ourUtils.db_quick_query(db_conn, Queries.get_our_genre_by_ip, (ip,))[0]
    genre_num = model.genre_names.index(results[0])
    return jsonify(genreNum=genre_num)

if __name__ == '__main__':
    app.run()
