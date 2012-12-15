
$(document).ready(function (){

  dataSource = new kendo.data.DataSource({
    pageSize: 100,
    autoSync: false,
    transport: {
      read: {
        url: '/api/notes/',
        dataType: 'json',
        type: 'GET',
      },
      create: {
        url: '/api/notes/',
        dataType: 'json',
        type: 'POST'
      },
      update: {
        url: '/api/notes/',
        dataType: 'json',
        type: 'PUT',
      },
      destroy: {
        url: function(options, operation) {
             return '/api/notes/' + options.id;
        },
        type: 'DELETE',
      },
    },
    schema: {
      data: function(reply) { 
        return reply.rows;
      },
      model: {
        id: "id",
        fields: {
          id: {
            type: "string",
            editable: false,
            nullable: false,
          },
          rid: {
            type: "string",
            editable: false,
            nullable: false
          },
          name: {
            type: "string",
            editable: true,
            nullable: false,
            validation: { required: true }
          },
          author: {
            type: "string",
            editable: true,
            nullable: false,
            validation: { required: true }
          },
        },
      },
    },
  });

  $("#grid").kendoGrid({
    dataSource: dataSource,
    navigatable: true,
    pageable: true,
    height: 500,
    editable: 'popup',
    toolbar: [
      { name: "create", text: "New" }, 
      { name: "cancel", text: "Cancel" }
    ],
    columns: [
      { field: "id", title: "ID", width: 50, editable: false },
      { field: "name", title: "Book", width: 150, nullable: false },
      { field: "author", title: "Author", width: 100, nullable: false },
      { field: "rid", title: "№", width: 50, editable: false },
      { command: ["edit", "destroy"], title: "&nbsp;", width: 110 },
    ],
  });
});

