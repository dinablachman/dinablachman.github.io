// Recipes are data only. Every drink runs through the same glass, ice, pour,
// foam and drink-down code; a recipe just chooses colours, amounts, garnish
// and what the barista says.
//
// step kinds -> engine primitives
//   pour    hold: pour a liquid layer   { color, top, amount, holdMs }
//   ice     hold: drop cubes            { count }
//   foam    hold: pipe cold foam        { tint }
//   garnish auto: dust / petal          { id }
//
// `amount` is a fraction of the glass; a recipe's pours should sum to ~0.84
// so there is headroom for foam under the rim.

export const RECIPES = [
  {
    id: 'vanilla-pumpkin',
    name: 'vanilla iced latte',
    sub: 'pumpkin cream cold foam',
    blurb: 'espresso, vanilla, oat milk, ice, pumpkin cream',
    swatch: 'linear-gradient(#f3d3a6 0 28%, #eadbc9 28% 62%, #3a2214 62%)',
    intro: 'vanilla, then the shot. you pour, i talk.',
    steps: [
      { kind: 'pour', id: 'espresso', label: 'hold to pull the shot',
        color: '#3a2214', top: '#6b4226', amount: 0.26, holdMs: 1500,
        say: 'the shot blooms dark against the glass. it smells like the good part of the morning.' },
      { kind: 'pour', id: 'syrup', label: 'hold to add vanilla',
        color: '#c98a4a', top: '#e3ab6b', amount: 0.06, holdMs: 900,
        say: 'a slow ribbon of vanilla. it sinks, then thinks about it.' },
      { kind: 'pour', id: 'milk', label: 'hold to pour the milk',
        color: '#ede0cf', top: '#f7efe3', amount: 0.52, holdMs: 1800,
        say: 'milk clouds up through the espresso. this is the part everyone watches.' },
      { kind: 'ice', label: 'hold to add ice', count: 4,
        say: 'four cubes. the glass goes cold in your hand.' },
      { kind: 'foam', label: 'hold to pipe the foam', tint: '#f2c08d',
        say: 'pumpkin cream, piped in one turn. it settles like a small hat.' },
      { kind: 'garnish', id: 'dust', say: 'a shake of cinnamon over the top. done.' }
    ],
    handoff: 'here. vanilla iced latte, pumpkin cream. take your time.',
    empty: 'just ice now, sweating a little. that was a good one.'
  },
  {
    id: 'tiramisu',
    name: 'tiramisu iced latte',
    sub: 'mascarpone foam, cocoa',
    blurb: 'espresso, brown sugar, milk, ice, mascarpone cream, cocoa',
    swatch: 'linear-gradient(#f1e7d6 0 26%, #d9c3a8 26% 60%, #2e1a10 60%)',
    intro: 'a dessert pretending to be a coffee. let\u2019s pretend together.',
    steps: [
      { kind: 'pour', id: 'espresso', label: 'hold to pull the shot',
        color: '#2e1a10', top: '#5a3520', amount: 0.26, holdMs: 1500,
        say: 'a double, dark and a little bitter. the tiramisu needs something to lean on.' },
      { kind: 'pour', id: 'syrup', label: 'hold to add brown sugar',
        color: '#8a4d22', top: '#b56f3a', amount: 0.06, holdMs: 900,
        say: 'brown sugar syrup. it goes amber where it meets the espresso.' },
      { kind: 'pour', id: 'milk', label: 'hold to pour the milk',
        color: '#e6d8c4', top: '#f4ebdd', amount: 0.52, holdMs: 1800,
        say: 'the milk marbles in. for a second it looks like a painting of weather.' },
      { kind: 'ice', label: 'hold to add ice', count: 4,
        say: 'ice. it clinks, which is most of the reason to have it.' },
      { kind: 'foam', label: 'hold to pipe the mascarpone', tint: '#f3e6d0',
        say: 'mascarpone cream, thick enough to hold a spoon upright.' },
      { kind: 'garnish', id: 'cocoa', say: 'cocoa, dusted through a sieve. it lands like quiet.' }
    ],
    handoff: 'tiramisu iced latte. eat the top with a spoon if you want. i won\u2019t look.',
    empty: 'empty. a little cocoa left on the rim, the way it should be.'
  },
  {
    id: 'rose',
    name: 'rose iced latte',
    sub: 'rose cold foam, petal',
    blurb: 'espresso, rose syrup, milk, ice, rose foam',
    swatch: 'linear-gradient(#f5d3da 0 26%, #eedfd6 26% 60%, #3a2214 60%)',
    intro: 'rose is a small amount of a big thing. we\u2019ll go easy.',
    steps: [
      { kind: 'pour', id: 'espresso', label: 'hold to pull the shot',
        color: '#3a2214', top: '#6b4226', amount: 0.26, holdMs: 1500,
        say: 'the shot lands. rose needs something dark to be soft against.' },
      { kind: 'pour', id: 'syrup', label: 'hold to add rose syrup',
        color: '#b8506e', top: '#d6708c', amount: 0.07, holdMs: 1000,
        say: 'rose syrup, just enough. any more and it tastes like a drawer.' },
      { kind: 'pour', id: 'milk', label: 'hold to pour the milk',
        color: '#eedfd6', top: '#f8efe9', amount: 0.51, holdMs: 1800,
        say: 'the milk turns it the colour of the inside of a shell.' },
      { kind: 'ice', label: 'hold to add ice', count: 4,
        say: 'ice, four. they bob, then agree on where to sit.' },
      { kind: 'foam', label: 'hold to pipe the foam', tint: '#f6d5dc',
        say: 'rose cold foam, barely pink. it holds a peak.' },
      { kind: 'garnish', id: 'petal', say: 'one petal, set on the foam. that\u2019s the whole garnish.' }
    ],
    handoff: 'rose iced latte. drink it before the petal gets ideas.',
    empty: 'gone. the petal made it to the bottom, mostly.'
  }
];
