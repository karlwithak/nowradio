from logging import FileHandler
import logging
from flask import Flask, render_template, request, jsonify
import psycopg2
from dbManager import Queries, dbpass
from model import genre_list
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
page_size = 10


try:
    db_conn = psycopg2.connect("dbname=radiodb user=radiodb host=localhost password=%s" % dbpass)
except psycopg2.DatabaseError:
    app.logger.error("could not connect to db!")


@app.route('/')
def render_landing():
    return render_template("player.html")


@app.route('/get-stations/')
def get_stations():
    genre_names = genre_list[int(request.args.get('genre', ''))]
    app.logger.info("%s, %s", genre_names, request.args.get('page', ''))
    data = {
        'genre_names': genre_names,
        'page_number': page_size * int(request.args.get('page', '')),
        'page_size':   page_size
    }
    results = ourUtils.db_quick_query(db_conn, Queries.get_urls_by_genre, data)
    app.logger.info(str(results))
    return jsonify(stations=results)


@app.route('/get-genre-count/')
def get_genre_count():
    return jsonify(genreCount=len(genre_list))


if __name__ == '__main__':
    app.run()
