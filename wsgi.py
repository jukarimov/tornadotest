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

from datetime import date
import json

class DateEncoder(json.JSONEncoder):
  def default(self, obj):
    if isinstance(obj, date):
      return str(obj)
    #return json.JSONEncoder.default(self, obj)

class Main(RequestHandler):
  def get(self):
    ui = self.get_argument('ui', 'main')
    self.render('%s.html' % ui, ui = ui)

class APINotes(RequestHandler):
  @property
  def db(self):
    return connect("user='pguser' host='localhost' dbname='pgdb' password='pgpass'")

  def get(self, rid=None):
    sort_map = {
      'id': 1,
      'name': 2,
      'author': 3,
      'published': 4,
    }
    conn    = self.db
    cursor  = conn.cursor(cursor_factory=RealDictCursor)
    page    = self.get_argument('page', None)
    rows    = self.get_argument('rows', None)
    sort    = self.get_argument('sort', None)
    order   = self.get_argument('order','asc')
    
    if not page or not rows:
      print 'get: warning: no page or size specified'
      cursor.execute('SELECT * FROM books')
    else:
      try:
        page = abs(int(page) - 1)
        rows = abs(int(rows))
      except:
        self.write('Bad query') 
        print 'get: warning: Bad query', page, rows
        return 
      if page > sys.maxint or rows > sys.maxint:
        self.write('Bad query') 
        print 'get: warning: Bad query', page, rows
        return
      cursor.execute('SELECT                        \
                        id, name, author, published \
                        FROM books                  \
                        ORDER BY %s ' + order + '   \
                        OFFSET %s                   \
                        LIMIT %s',
                      (sort_map.get(sort,1),
                        (page * rows),
                        rows))
    records = cursor.fetchall()
    records = json.loads(json.dumps(records, cls=DateEncoder))
    print records
    cursor.execute('SELECT COUNT(id) FROM books')
    total_rows = cursor.fetchall()[0]['count']
    cursor.close()
    self.write({
      'total': total_rows,
      'rows': records
    })

  def post(self, rid = None):
    name   = self.get_argument('name', None)
    author = self.get_argument('author', None)
    published = self.get_argument('published', None)

    if name == '' or name == None:
      print 'post: warning: empty name'
      return

    if author == '' or author == None:
      print 'post: warning: empty author'
      return

    conn   = self.db
    cursor = conn.cursor()
    cursor.execute("INSERT INTO books \
                    (name,author,published) VALUES (%s,%s,%s)", (name,author,published))
    conn.commit()
    conn.close()

  def put(self, rid=None):
    name   = self.get_argument('name')
    author = self.get_argument('author')
    published = self.get_argument('published', None)
    rowid  = self.get_argument('id')
    conn   = self.db
    cursor = conn.cursor()

    if name == '' or name == None:
      print 'put: warning: empty name'
      return

    if author == '' or author == None:
      print 'put: warning: empty author'
      return

    if rowid == '' or rowid == None:
      print 'put: warning: empty rowid'
      return

    if rowid == 'null':
      cursor.execute("INSERT INTO books \
                    (name,author,published) VALUES (%s,%s,%s)", (name,author,published))
    else:
      cursor.execute("UPDATE books SET name=%s, author=%s WHERE id=%s", (name,author,rowid))

    conn.commit()
    conn.close()

  def delete(self, rid=None):

    if not rid or rid == '':
      print 'delete: warning: empty id'
      return

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

def runserver(port=8000):
  app = tornado.web.Application(routes, **settings)
  http_server = tornado.httpserver.HTTPServer(app)
  http_server.listen(port)
  print 'http://localhost:' + str(port)
  tornado.ioloop.IOLoop.instance().start()
  

if __name__=='__main__':
  try:
    runserver()
  except KeyboardInterrupt:
    print '\nBye'
