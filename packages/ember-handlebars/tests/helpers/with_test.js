/*globals Foo */
/*jshint newcap:false*/
import EmberView from "ember-views/views/view";
import run from "ember-metal/run_loop";
import EmberObject from "ember-runtime/system/object";
import { computed } from "ember-metal/computed";
import EmberHandlebars from "ember-handlebars-compiler";
import { set } from "ember-metal/property_set";
import { get } from "ember-metal/property_get";
import ObjectController from "ember-runtime/controllers/object_controller";
import Container from "ember-runtime/system/container";
import { A } from "ember-runtime/system/native_array";

function appendView(view) {
  run(function() { view.appendTo('#qunit-fixture'); });
}

var view;
var originalLookup = Ember.lookup, lookup;

QUnit.module("Handlebars {{#with}} helper", {
  setup: function() {
    Ember.lookup = lookup = { Ember: Ember };

    view = EmberView.create({
      template: EmberHandlebars.compile("{{#with person as tom}}{{title}}: {{tom.name}}{{/with}}"),
      context: {
        title: "Señor Engineer",
        person: { name: "Tom Dale" }
      }
    });

    appendView(view);
  },

  teardown: function() {
    run(function() {
      view.destroy();
    });
    Ember.lookup = originalLookup;
  }
});

test("it should support #with foo as bar", function() {
  equal(view.$().text(), "Señor Engineer: Tom Dale", "should be properly scoped");
});

test("updating the context should update the alias", function() {
  run(function() {
    view.set('context.person', {
      name: "Yehuda Katz"
    });
  });

  equal(view.$().text(), "Señor Engineer: Yehuda Katz", "should be properly scoped after updating");
});

test("updating a property on the context should update the HTML", function() {
  run(function() {
    set(view, 'context.person.name', "Yehuda Katz");
  });

  equal(view.$().text(), "Señor Engineer: Yehuda Katz", "should be properly scoped after updating");
});

test("updating a property on the view should update the HTML", function() {
  run(function() {
    view.set('context.title', "Señorette Engineer");
  });

  equal(view.$().text(), "Señorette Engineer: Tom Dale", "should be properly scoped after updating");
});

QUnit.module("Multiple Handlebars {{with}} helpers with 'as'", {
  setup: function() {
    Ember.lookup = lookup = { Ember: Ember };

    view = EmberView.create({
      template: EmberHandlebars.compile("Admin: {{#with admin as person}}{{person.name}}{{/with}} User: {{#with user as person}}{{person.name}}{{/with}}"),
      context: {
        admin: { name: "Tom Dale" },
        user: { name: "Yehuda Katz"}
      }
    });

    appendView(view);
  },

  teardown: function() {
    run(function() {
      view.destroy();
    });
    Ember.lookup = originalLookup;
  }
});

test("re-using the same variable with different #with blocks does not override each other", function(){
  equal(view.$().text(), "Admin: Tom Dale User: Yehuda Katz", "should be properly scoped");
});

test("the scoped variable is not available outside the {{with}} block.", function(){
  run(function() {
    view.set('template', EmberHandlebars.compile("{{name}}-{{#with other as name}}{{name}}{{/with}}-{{name}}"));
    view.set('context', {
      name: 'Stef',
      other: 'Yehuda'
    });
  });

  equal(view.$().text(), "Stef-Yehuda-Stef", "should be properly scoped after updating");
});

test("nested {{with}} blocks shadow the outer scoped variable properly.", function(){
  run(function() {
    view.set('template', EmberHandlebars.compile("{{#with first as ring}}{{ring}}-{{#with fifth as ring}}{{ring}}-{{#with ninth as ring}}{{ring}}-{{/with}}{{ring}}-{{/with}}{{ring}}{{/with}}"));
    view.set('context', {
      first: 'Limbo',
      fifth: 'Wrath',
      ninth: 'Treachery'
    });
  });

  equal(view.$().text(), "Limbo-Wrath-Treachery-Wrath-Limbo", "should be properly scoped after updating");
});
QUnit.module("Handlebars {{#with}} globals helper [DEPRECATED]", {
  setup: function() {
    Ember.lookup = lookup = { Ember: Ember };

    ignoreDeprecation(function() {
      lookup.Foo = { bar: 'baz' };
      view = EmberView.create({
        template: EmberHandlebars.compile("{{#with Foo.bar as qux}}{{qux}}{{/with}}")
      });

      appendView(view);
    });
  },

  teardown: function() {
    run(function() {
      view.destroy();
    });
    Ember.lookup = originalLookup;
  }
});

test("it should support #with Foo.bar as qux [DEPRECATED]", function() {
  equal(view.$().text(), "baz", "should be properly scoped");

  ignoreDeprecation(function() {
    run(function() {
        set(lookup.Foo, 'bar', 'updated');
    });
  });

  equal(view.$().text(), "updated", "should update");
});

QUnit.module("Handlebars {{#with keyword as foo}}");

test("it should support #with view as foo", function() {
  var view = EmberView.create({
    template: EmberHandlebars.compile("{{#with view as myView}}{{myView.name}}{{/with}}"),
    name: "Sonics"
  });

  appendView(view);
  equal(view.$().text(), "Sonics", "should be properly scoped");

  run(function() {
    set(view, 'name', "Thunder");
  });

  equal(view.$().text(), "Thunder", "should update");

  run(function() {
    view.destroy();
  });
});

test("it should support #with name as food, then #with foo as bar", function() {
  var view = EmberView.create({
    template: EmberHandlebars.compile("{{#with name as foo}}{{#with foo as bar}}{{bar}}{{/with}}{{/with}}"),
    context: { name: "caterpillar" }
  });

  appendView(view);
  equal(view.$().text(), "caterpillar", "should be properly scoped");

  run(function() {
    set(view, 'context.name', "butterfly");
  });

  equal(view.$().text(), "butterfly", "should update");

  run(function() {
    view.destroy();
  });
});

QUnit.module("Handlebars {{#with this as foo}}");

test("it should support #with this as qux", function() {
  var view = EmberView.create({
    template: EmberHandlebars.compile("{{#with this as person}}{{person.name}}{{/with}}"),
    controller: EmberObject.create({ name: "Los Pivots" })
  });

  appendView(view);
  equal(view.$().text(), "Los Pivots", "should be properly scoped");

  run(function() {
    set(view, 'controller.name', "l'Pivots");
  });

  equal(view.$().text(), "l'Pivots", "should update");

  run(function() {
    view.destroy();
  });
});

QUnit.module("Handlebars {{#with foo}} insideGroup");

test("it should render without fail", function() {
  var View = EmberView.extend({
    template: EmberHandlebars.compile("{{#view view.childView}}{{#with person}}{{name}}{{/with}}{{/view}}"),
    controller: EmberObject.create({ person: { name: "Ivan IV Vasilyevich" } }),
    childView: EmberView.extend({
      render: function(){
        this.set('templateData.insideGroup', true);
        return this._super.apply(this, arguments);
      }
    })
  });

  var view = View.create();
  appendView(view);
  equal(view.$().text(), "Ivan IV Vasilyevich", "should be properly scoped");

  run(function() {
    set(view, 'controller.person.name', "Ivan the Terrible");
  });

  equal(view.$().text(), "Ivan the Terrible", "should update");

  run(function() {
    view.destroy();
  });
});

QUnit.module("Handlebars {{#with foo}} with defined controller");

test("it should wrap context with object controller", function() {
  var Controller = ObjectController.extend({
    controllerName: computed(function() {
      return "controller:"+this.get('model.name') + ' and ' + this.get('parentController.name');
    })
  });

  var person = EmberObject.create({name: 'Steve Holt'});
  var container = new Container();

  var parentController = EmberObject.create({
    container: container,
    name: 'Bob Loblaw'
  });

  view = EmberView.create({
    container: container,
    template: EmberHandlebars.compile('{{#with view.person controller="person"}}{{controllerName}}{{/with}}'),
    person: person,
    controller: parentController
  });

  container.register('controller:person', Controller);

  appendView(view);

  equal(view.$().text(), "controller:Steve Holt and Bob Loblaw");

  run(function() {
    view.rerender();
  });

  equal(view.$().text(), "controller:Steve Holt and Bob Loblaw");

  run(function() {
    parentController.set('name', 'Carl Weathers');
    view.rerender();
  });

  equal(view.$().text(), "controller:Steve Holt and Carl Weathers");

  run(function() {
    person.set('name', 'Gob');
    view.rerender();
  });

  equal(view.$().text(), "controller:Gob and Carl Weathers");

  strictEqual(view.get('_childViews')[0].get('controller.target'), parentController, "the target property of the child controllers are set correctly");

  run(function() { view.destroy(); }); // destroy existing view
});

test("it should still have access to original parentController within an {{#each}}", function() {
  var Controller = ObjectController.extend({
    controllerName: computed(function() {
      return "controller:"+this.get('model.name') + ' and ' + this.get('parentController.name');
    })
  });

  var people = A([{ name: "Steve Holt" }, { name: "Carl Weathers" }]);
  var container = new Container();

  var parentController = EmberObject.create({
    container: container,
    name: 'Bob Loblaw',
    people: people
  });

  view = EmberView.create({
    container: container,
    template: EmberHandlebars.compile('{{#each person in people}}{{#with person controller="person"}}{{controllerName}}{{/with}}{{/each}}'),
    controller: parentController
  });

  container.register('controller:person', Controller);

  appendView(view);

  equal(view.$().text(), "controller:Steve Holt and Bob Loblawcontroller:Carl Weathers and Bob Loblaw");

  run(function() { view.destroy(); }); // destroy existing view
});

test("it should wrap keyword with object controller", function() {
  var PersonController = ObjectController.extend({
    name: computed('model.name', function() {
      return get(this, 'model.name').toUpperCase();
    })
  });

  var person = EmberObject.create({name: 'Steve Holt'});
  var container = new Container();

  var parentController = EmberObject.create({
    container: container,
    person: person,
    name: 'Bob Loblaw'
  });

  view = EmberView.create({
    container: container,
    template: EmberHandlebars.compile('{{#with person as steve controller="person"}}{{name}} - {{steve.name}}{{/with}}'),
    controller: parentController
  });

  container.register('controller:person', PersonController);

  appendView(view);

  equal(view.$().text(), "Bob Loblaw - STEVE HOLT");

  run(function() {
    view.rerender();
  });

  equal(view.$().text(), "Bob Loblaw - STEVE HOLT");

  run(function() {
    parentController.set('name', 'Carl Weathers');
    view.rerender();
  });

  equal(view.$().text(), "Carl Weathers - STEVE HOLT");

  run(function() {
    person.set('name', 'Gob');
    view.rerender();
  });

  equal(view.$().text(), "Carl Weathers - GOB");

  run(function() { view.destroy(); }); // destroy existing view
});

test("destroys the controller generated with {{with foo controller='blah'}}", function() {
  var destroyed = false;
  var Controller = ObjectController.extend({
    willDestroy: function() {
      this._super();
      destroyed = true;
    }
  });

  var person = EmberObject.create({name: 'Steve Holt'});
  var container = new Container();

  var parentController = EmberObject.create({
    container: container,
    person: person,
    name: 'Bob Loblaw'
  });

  view = EmberView.create({
    container: container,
    template: EmberHandlebars.compile('{{#with person controller="person"}}{{controllerName}}{{/with}}'),
    controller: parentController
  });

  container.register('controller:person', Controller);

  appendView(view);

  run(view, 'destroy'); // destroy existing view

  ok(destroyed, 'controller was destroyed properly');
});

test("destroys the controller generated with {{with foo as bar controller='blah'}}", function() {
  var destroyed = false;
  var Controller = ObjectController.extend({
    willDestroy: function() {
      this._super();
      destroyed = true;
    }
  });

  var person = EmberObject.create({name: 'Steve Holt'});
  var container = new Container();

  var parentController = EmberObject.create({
    container: container,
    person: person,
    name: 'Bob Loblaw'
  });

  view = EmberView.create({
    container: container,
    template: EmberHandlebars.compile('{{#with person as steve controller="person"}}{{controllerName}}{{/with}}'),
    controller: parentController
  });

  container.register('controller:person', Controller);

  appendView(view);

  run(view, 'destroy'); // destroy existing view

  ok(destroyed, 'controller was destroyed properly');
});

QUnit.module("{{#with}} helper binding to view keyword", {
  setup: function() {
    Ember.lookup = lookup = { Ember: Ember };

    view = EmberView.create({
      template: EmberHandlebars.compile("We have: {{#with view.thing as fromView}}{{fromView.name}} and {{fromContext.name}}{{/with}}"),
      thing: { name: 'this is from the view' },
      context: {
        fromContext: { name: "this is from the context" },
      }
    });

    appendView(view);
  },

  teardown: function() {
    run(function() {
      view.destroy();
    });
    Ember.lookup = originalLookup;
  }
});

test("{{with}} helper can bind to keywords with 'as'", function(){
  equal(view.$().text(), "We have: this is from the view and this is from the context", "should render");
});
