define(
  'ephox.alloy.spec.TabbarSpec',

  [
    'ephox.alloy.spec.SpecSchema',
    'ephox.alloy.spec.UiSubstitutes',
    'ephox.boulder.api.FieldPresence',
    'ephox.boulder.api.FieldSchema',
    'ephox.boulder.api.Objects',
    'ephox.boulder.api.ValueSchema',
    'ephox.compass.Arr',
    'ephox.highway.Merger',
    'ephox.perhaps.Option'
  ],

  function (SpecSchema, UiSubstitutes, FieldPresence, FieldSchema, Objects, ValueSchema, Arr, Merger, Option) {
    var schema = [
      FieldSchema.strict('tabs'),

      FieldSchema.strict('onExecute'),
      FieldSchema.strict('dom'),

      FieldSchema.field(
        'members',
        'members',
        FieldPresence.strict(),
        ValueSchema.objOf([
          FieldSchema.strict('tab')
        ])
      ),

      FieldSchema.field(
        'markers',
        'markers',
        FieldPresence.strict(),
        ValueSchema.objOf([
          FieldSchema.strict('tabClass'),
          FieldSchema.strict('selectedClass')
        ])
      )
    ];

    var make = function (spec) {
      var detail = SpecSchema.asStructOrDie('tabbed', schema, spec, [
        'tabs'
      ]);

      console.log('tabbar.2', detail.parts().tabs());

      var placeholders = {
        '<alloy.tabs>': UiSubstitutes.multiple(
          Arr.map(detail.tabs(), function (tab) {
            var munged = detail.members().tab().munge(tab);
            return Merger.deepMerge(
              munged,
              {
                uiType: 'button',
                dom: {
                  tag: 'button'
                },
                representing: {
                  query: function () {
                    return tab.value;
                  },
                  set: function () { }
                },
                action: function (button) {
                  var bar = button.getSystem().getByUid(detail.uid()).getOrDie();
                  bar.apis().highlight(button);
                  detail.onExecute()(bar, button);
                }
              }
            );
          })
        )
      };

      var components = UiSubstitutes.substitutePlaces(
        Option.some('tabbar'),
        detail,
        detail.components(),
        placeholders,
        { }
      );

      return {
        uid: detail.uid(),
        uiType: 'custom',
        dom: detail.dom(),
        highlighting: {
          highlightClass: detail.markers().selectedClass(),
          itemClass: detail.markers().tabClass()
        },
        components: components
      };
    };

    return {
      make: make
    };
  }
);