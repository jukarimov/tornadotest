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

    clientui = self.get_argument('ui', None)

    if clientui == 'kendo':
      self.render('kendoedit.html')
    else:
      self.render('edit.html')

class APINotes(RequestHandler):
  def get(self, arg):
    page = self.get_argument('page', None)
    size = self.get_argument('rows', None)
    sorder = self.get_argument('sort', None)
    conn = connect("user='pguser' host='localhost' dbname='pgdb' password='pgpass'")
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    records = []
    if not page or not size:
      cursor.execute('SELECT * FROM books')
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

      cursor.execute('SELECT * FROM books ORDER BY ' + str(sorder) + ' OFFSET %s LIMIT %s',
		     ((page * size), size))

    records = cursor.fetchall()

    cursor.execute('SELECT COUNT(id) FROM books')
    total_rows = cursor.fetchall()[0]['count']
    cursor.close()

    self.write({
      'total': total_rows,
      'rows': records
    })

  def post(self, arg):
    conn = connect("user='pguser' host='localhost' dbname='pgdb' password='pgpass'")
    cursor = conn.cursor()

    data = self.get_argument('data')
    print 'data posted:', data
    rows = json_parse(data)
    for row in rows:
      cursor.execute("SELECT * FROM addbook(%s, %s, %s);",
		      (str(row['id']), row['name'], row['author']))
    conn.commit()
    conn.close()

  def put(self, arg):
    print 'put called', arg

  def delete(self, arg):
    conn = connect("user='pguser' host='localhost' dbname='pgdb' password='pgpass'")
    cursor = conn.cursor()

    for i in arg.split(','):
      cursor.execute("DELETE FROM books WHERE id=%s;", (i,))

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

