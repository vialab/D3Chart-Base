import flask
from flask import Flask, jsonify, render_template
from flask import abort, request, session, g, make_response
from flask import Flask, session, redirect, url_for, escape, request

import linedata
import json



from pprint import pprint
# import database as db
import pickle

from scipy.sparse import csr_matrix
import numpy as np
import os


app = Flask(__name__)
app.secret_key = 'the random string'


@app.route('/')
def index():

    return render_template('ngram.html' )


@app.route("/unigramdata", methods=['POST','GET'])
def unigram():
    print("unigram ",request)
    pprint(request.json)

    ret = []

    dataset = linedata.LineDataset()
    dataset.addLine( linedata.get_line_data() )
    dataset.addLine( linedata.get_line_data() )

    return jsonify( dataset.serialize() )


def main():
    g.filtercategories = [
        'Country',
        'Discipline',
        'Specialty',
    ]

    app.config['ENV'] = 'development'
    app.config['DEBUG'] = True
    app.config['TESTING'] = True

    app.run(debug=True)


if __name__ == '__main__':
      main()

