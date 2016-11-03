define(
  'ephox.alloy.api.behaviour.Transitioning',

  [
    'ephox.alloy.api.behaviour.BehaviourExport'
  ],

  function (BehaviourExport) {
    return BehaviourExport.build(
      'transitioning',
      [
        'transition',
        'revertToBase'
      ],
      { }
    );
  }
);