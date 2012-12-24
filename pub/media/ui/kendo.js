
$(document).ready(function (){

  dataSource = new kendo.data.DataSource({
    pageSize: 10,
    serverPaging: true,
    serverSorting: true,
    //serverFiltering: true,
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
          if (map.sort) {
            map.sort = map.sort[0]
            if (map.sort) {
              var t = map.sort
              map.sort = t.field
              map.order = t.dir
            }
          }
										if (map.filt) {
            console.log(kendo.stringify(map.filt))
										}
        }
        if (operation == 'update') {
          map = options
          map.published = options.published.toISOString().split('T')[0]
        }
        if (operation == 'create') {
          map = options
          map.published = options.published.toISOString().split('T')[0]
        }
        return map
      },
    },
    schema: {
      data: function(reply) { 
        var rs = eval(reply.rows)
        return rs; 
      },
      total: function(reply) {
        var tt = reply.total
        return tt; 
      },
      model: {
        id: "id",
        fields: {
          id: {
            type: "number",
            editable: false,
          },
          name: {
            type: "string",
            editable: true,
            validation: { required: true }
          },
          author: {
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
      { field: "id", title: "ID", width: 50, editable: false },
      { field: "name", title: "Book", width: 150, nullable: false },
      { field: "author", title: "Author", width: 100, nullable: false },
      { field: "published", title: "Published", width: 100, nullable: false },
      { command: ["edit", "destroy"], title: "&nbsp;", width: 110 },
    ],
  })
})

$(window).resize(function(){
  var height = $(window).height()
  $('#grid').height(height - (height/9))
  $('#grid').find(".k-grid-content").height(height - (height/9) - 90)
})
