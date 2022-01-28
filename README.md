
```
$ yarn start {command: 'solve' | 'interactive'} {depth} {hard?: 'true' | 'false'} {beamSize} {firstWord?: string}
```

To solve hard mode,

```
$ yarn start solve 10 true 20
```

To solve normal mode interactive with first word 'trace',

```
$ yarn start interactive 10 false 20 trace

round 0; wordSet.length: 2315
trace ? (black: 0, yellow: 1, green: 2) (3.50s)
> 10000

round 1; wordSet.length: 113
point ? (black: 0, yellow: 1, green: 2)
> 02022

round 2; wordSet.length: 1
mount ? (black: 0, yellow: 1, green: 2)
> 22222
```