$(document).ready(function (){
  dataSource = new kendo.data.DataSource({
    pageSize: 10,
    serverPaging: true,
    serverSorting: true,
    serverFiltering: true,
    transport: {
      read: {
        url: '/api/notes/',
        dataType: 'json',
        type: 'GET',
      },
      create: {
        url: '/api/notes/',
        dataType: 'json',
        type: 'POST',
        complete: function(request, textStatus) {
          $("#grid").data("kendoGrid").dataSource.read()
        }
      },
      update: {
        url: '/api/notes/',
        dataType: 'json',
        type: 'PUT',
      },
      destroy: {
        url: function(row) {
          return '/api/notes/' + row.id
        },
        type: 'DELETE',
      },
      parameterMap: function(options, operation) {
        var map = {}
        if (operation == 'read') {
          map.page = options.page
          map.rows = options.take
          map.sort = options.sort
          map.filt = options.filter
          map.sqlc = []
          if (map.sort) {
            map.sort = map.sort[0]
            if (map.sort) {
              var t = map.sort
              map.sort = t.field
              map.order = t.dir
            }
          }
          if (map.filt) {
            var filters = map.filt.filters
            console.log('##########[ BEGIN ]#########')
												var f1 = 0;
            for (i in filters) {
              if (filters[i].field) {
                console.log(objunpack(filters[i]))
                map.sqlc.push(objunpack(filters[i]))
                if (i < filters.length-1) {
                  console.log(objunpack(map.filt.logic))
                  map.sqlc.push(objunpack(map.filt.logic))
                }
              } else {
                if (map.sqlc.length > 0 && ((t=map.sqlc[map.sqlc.length-1]) != 'and' && t != 'or')) {
                  console.log(objunpack(map.filt.logic))
                  map.sqlc.push(objunpack(map.filt.logic))
                }
                console.log(objunpack(filters[i].filters[0]))
                map.sqlc.push(objunpack(filters[i].filters[0]))
                console.log(objunpack(filters[i].logic))
                map.sqlc.push(objunpack(filters[i].logic))
                alert(objunpack(filters[i].logic))
                console.log(objunpack(filters[i].filters[1]))
                map.sqlc.push(objunpack(filters[i].filters[1]))
              }
            }
            map.sqlc = map.sqlc.toString()
            console.log(map.sqlc)
            console.log('##########[ CUT HERE ]#########')
          }
        }
        if (operation == 'update') {
          map = options
          map.published = Date2MDY(options.published)
        }
        if (operation == 'create') {
          map = options
          map.published = Date2MDY(options.published)
        }
        return map
      },
    },
    schema: {
      data: function(reply) { 
        var rs = reply.rows
        return rs
      },
      total: function(reply) {
        var tt = reply.total
        return tt
      },
      model: {
        id: "id",
        fields: {
          id: {
            type: "number",
            editable: false,
          },
          book: {
            type: "string",
            editable: true,
            validation: { required: true }
          },
          author: {
            type: "string",
            editable: true,
            validation: { required: true }
          },
          cat: {
            type: "string",
            editable: true,
            validation: { required: true }
          },
          published: {
            type: "date",
            editable: true,
            validation: { required: true }
          }
        },
      },
    },
  })

  $("#grid").kendoGrid({
    dataSource: dataSource,
    navigatable: true,
    pageable: true,
    //height: 500,
    editable: 'popup',
    sortable: true,
    filterable: true,
    scrollable: true,
    toolbar: [
      { name: "create", text: "Add" }, 
    ],
    columns: [
      { field: "id", title: "ID", width: 50 },
      { field: "book", title: "Book", width: 150 },
      { field: "author", title: "Author", width: 100 },
      { field: "published", title: "Published", format: "{0:MM-dd-yyyy}",	width: 80 },
      { field: "cat", title: "Category", width: 100 },
      { command: ["edit", "destroy"], title: "&nbsp;", width: 110 },
    ],
  })
})
$(window).resize(function(){
  var height = $(window).height()
  $('#grid').height(height - (height/9))
  $('#grid').find(".k-grid-content").height(height - (height/9) - 90)
})
function objunpack(o){
  if (o.field && o.operator && o.value) {
    if (o.field == 'published') {
      var t = o.value
      o.value = Date2MDY(t)
    }
    return [o.field, o.operator, o.value]
  }
  return o
}
function Date2MDY(date) {
  var dmy = '';
		dmy += String(date.getMonth()+1) + '-'
		dmy += String(date.getDate()) + '-'
		dmy += String(date.getFullYear())
  return dmy;
}
