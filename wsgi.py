#!/usr/bin/env python
# coding:utf-8

# http://en.wikipedia.org/wiki/Representational_state_transfer
import os
import sys

cwd = os.path.dirname(__file__)
sys.path.append(cwd)

import tornado.ioloop
import tornado.httpserver
from tornado.web import RequestHandler

from psycopg2 import connect
from psycopg2.extras import RealDictCursor


class Main(RequestHandler):
  def get(self):
    self.render('main.html')

class Edit(RequestHandler):
  def get(self):
    self.render('edit.html')

class APINotes(RequestHandler):
  def get(self):
    conn = connect('user=pguser host=localhost dbname=pgdb')
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute('SELECT * FROM public.books')
    records = cursor.fetchall()
    self.write({
      'total':len(records),
      'rows':records
    })

  def post(self):
    conn = connect('user=pguser host=localhost dbname=pgdb')
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    data = self.get_argument('data')
    print 'post:', data
    for row in eval(data):
       print "SQL: INSERT INTO books VALUES ('%s','%s','%s');" % \
		       (row['id'], row['name'], row['author'])
       cursor.execute("INSERT INTO books VALUES ('%s','%s','%s');" % \
		       (row['id'], row['name'], row['author'])
       )

  def put(self):
    print 'put'

  def delete(self):
    print 'delete'


routes = [
  (r'/', Main),
  (r'/edit/', Edit),
  (r'/api/notes/', APINotes),
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
  tornado.ioloop.IOLoop.instance().start()
