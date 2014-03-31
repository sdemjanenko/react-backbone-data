react-backbone-data
===================

React.addons.update is an awesome tool for updating
objects in an immutable way.  I wanted to build in
immutability to Backbone Models so that
shouldComponentUpdate can be fast.


Example
-------

Models

```javascript
var Article = ReactBackboneData.Model.extend({
  defaults: {
    title: "Default title"
  }
});
```

```javascript
var Author = ReactBackboneData.Model.extend({
  defaults: {
    name: "John Doe"
  }
});
```

Component

```javascript

var Component = React.createClass({
  mixins: [ReactBackboneData.Mixin],
  models: {
    article: Article,
    author: Author
  },
  componentWillMount: function() {
    this._models.article.fetch();
    this._models.author.fetch();
  },
  render: function() {
    return (
      <div>
        <h1>{this.state.article.title}</h1>
        <h2>by {this.state.author.name}</h2>
      </div>
    );
  }
});
```

React
```javascript
React.renderComponent(<Component articleId={1} authorId={1}/>, document.getElementById("page"));
```


Todo
----
- Support componentWillReceiveProps
- Add collection support
