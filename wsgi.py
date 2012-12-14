#!/usr/bin/env python
# coding:utf-8
# http://en.wikipedia.org/wiki/Representational_state_transfer

import os
import sys

cwd = os.path.dirname(__file__)

import tornado.ioloop
import tornado.httpserver

from tornado.web import RequestHandler
from tornado.web import HTTPError

from psycopg2 import connect
from psycopg2.extras import RealDictCursor

from json import loads as json_parse

class Main(RequestHandler):
  def get(self):
    ui = self.get_argument('ui', 'main')
    self.render('%s.html' % ui, ui = ui)

class APINotes(RequestHandler):
  @property
  def db(self):
    return connect("user='pguser' host='localhost' dbname='pgdb' password='pgpass'")

  def get(self, rid=None):
    order_map = {
      'rid': 4,
      'name': 2,
      'author': 3,
    }
    conn    = self.db
    cursor  = conn.cursor(cursor_factory=RealDictCursor)
    page    = self.get_argument('page', None)
    size    = self.get_argument('rows', None)
    sorder  = self.get_argument('sort', None)
    if not page or not size:
      cursor.execute('SELECT books.*, row_number() over() as rid FROM books')
    else:
      try:
        page = abs(int(page) - 1)
        size = abs(int(size))
      except:
        self.write('Bad query') 
        print 'Bad query', page, size
        return 
      if page > sys.maxint or size > sys.maxint:
        self.write('Bad query') 
        print 'Bad query', page, size
        return

      cursor.execute('SELECT books.*,      \
										                   row_number()  \
																													over() as rid \
																													FROM books    \
																													ORDER BY %s   \
																													OFFSET %s     \
																													LIMIT %s',
								(order_map.get(sorder,1),
									 (page * size),
								  size))

    records = cursor.fetchall()

    cursor.execute('SELECT COUNT(id) FROM books')
    total_rows = cursor.fetchall()[0]['count']
    cursor.close()

    self.write({
      'total': total_rows,
      'rows': records
    })

  def post(self, rid = None):
    conn   = self.db
    cursor = conn.cursor()
    cursor.execute("INSERT INTO books (name,author) VALUES (%s, %s)", (
      self.get_argument('name'),
      self.get_argument('author'))
    )
    conn.commit()
    conn.close()

  def put(self, rid=None):
    conn   = self.db
    cursor = conn.cursor()
    cursor.execute("UPDATE books SET name=%s, author=%s WHERE id=%s", (
      self.get_argument('name'),
      self.get_argument('author'),
      self.get_argument('id'))
    )
    conn.commit()
    conn.close()

  def delete(self, rid=None):
    conn   = self.db
    cursor = conn.cursor()
    cursor.execute("DELETE FROM books WHERE id = %s", (rid,))
    conn.commit()
    conn.close()

routes = [
  (r'/', Main),
  (r'/api/notes/([^/]+)?/?', APINotes),
]

settings = {
  'debug': True,
  'static_path': '%s/pub/media' % cwd,
  'static_url_prefix': '/media/',
  'template_path': '%s/tpl/' % cwd,
}

if __name__=='__main__':
  app = tornado.web.Application(routes, **settings)
  http_server = tornado.httpserver.HTTPServer(app)
  http_server.listen(8000)
  print 'http://localhost:8000'
  tornado.ioloop.IOLoop.instance().start()

