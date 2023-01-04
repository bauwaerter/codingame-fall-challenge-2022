/**
 * Auto-generated code below aims at helping you parse
 * the standard input according to the problem statement.
 **/

var inputs: string[] = readline().split(" ");
const width: number = parseInt(inputs[0]);
const height: number = parseInt(inputs[1]);

function calculateDistance(aCoord: Coordinates, bCoord: Coordinates) {
  const x = Math.abs(bCoord.x - aCoord.x);
  const y = Math.abs(bCoord.y - aCoord.y);
  return x + y;
}

function getDistances(
  fromCellArr: Cell[],
  toCellArr: Cell[]
): { from: Cell; to: Cell; distance: number }[] {
  let distanceArr: { from: Cell; to: Cell; distance: number }[] = [];
  for (let fromCell of fromCellArr) {
    let tempDistanceArr: { from: Cell; to: Cell; distance: number }[] = [];
    for (let toCell of toCellArr) {
      const distance = calculateDistance(
        fromCell.coordinates,
        toCell.coordinates
      );
      tempDistanceArr = [
        ...tempDistanceArr,
        { from: fromCell, to: toCell, distance },
      ];
    }
    const shortestDistance = tempDistanceArr.sort(
      (a, b) => a.distance - b.distance
    )[0];
    distanceArr = [...distanceArr, shortestDistance];
  }
  return distanceArr;
}

function getAdjacentCells(
  cellGrid: Cell[][],
  cell: Cell,
  height: number,
  width: number
): Cell[] {
  let adjacentCells: Cell[] = [];
  if (cell.coordinates.x > 0) {
    adjacentCells.push(cellGrid[cell.coordinates.x - 1][cell.coordinates.y]);
  }
  if (cell.coordinates.x < width - 1) {
    adjacentCells.push(cellGrid[cell.coordinates.x + 1][cell.coordinates.y]);
  }
  if (cell.coordinates.y > 0) {
    adjacentCells.push(cellGrid[cell.coordinates.x][cell.coordinates.y - 1]);
  }
  if (cell.coordinates.y < height - 1) {
    adjacentCells.push(cellGrid[cell.coordinates.x][cell.coordinates.y + 1]);
  }
  return adjacentCells.filter((cell) => cell.scrapAmount > 0 && !cell.recycler);
}

function getClosestCells(
  fromCellArr: Cell[],
  toCellArr: Cell[]
): { from: Cell; to: Cell; distance: number }[] {
  const distanceArr = getDistances(fromCellArr, toCellArr);
  const sortedDistanceArr = distanceArr.sort((a, b) => a.distance - b.distance);
  return sortedDistanceArr;
}

abstract class Action {
  abstract type: "MOVE" | "SPAWN" | "BUILD";
  abstract toString(): string;
}

class MoveAction extends Action {
  public readonly type = "MOVE";
  public readonly amount: number;
  public readonly fromX: number;
  public readonly fromY: number;
  public readonly toX: number;
  public readonly toY: number;

  constructor({
    amount,
    fromX,
    fromY,
    toX,
    toY,
  }: {
    amount: number;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
  }) {
    super();
    this.amount = amount;
    this.fromX = fromX;
    this.fromY = fromY;
    this.toX = toX;
    this.toY = toY;
  }

  toString(): string {
    return `MOVE ${this.amount} ${this.fromX} ${this.fromY} ${this.toX} ${this.toY};`;
  }
}

class SpawnAction extends Action {
  public readonly type = "SPAWN";
  public readonly amount: number;
  public readonly x: number;
  public readonly y: number;

  constructor({ amount, x, y }: { amount: number; x: number; y: number }) {
    super();
    this.amount = amount;
    this.x = x;
    this.y = y;
  }

  toString(): string {
    return `SPAWN ${this.amount} ${this.x} ${this.y};`;
  }
}

class BuildAction extends Action {
  public readonly type = "BUILD";
  public readonly x: number;
  public readonly y: number;

  constructor({ x, y }: { x: number; y: number }) {
    super();
    this.x = x;
    this.y = y;
  }

  toString(): string {
    return `BUILD ${this.x} ${this.y};`;
  }
}

const debug = (text: string) => {
  console.log(`MESSAGE ${text};`);
};

const Owner = {
  ME: 1,
  FOE: 0,
  NEUTRAL: -1,
} as const;

type Coordinates = { x: number; y: number };

interface Cell {
  coordinates: Coordinates;
  scrapAmount: number;
  owner: number;
  units: number;
  recycler: boolean;
  canBuild: boolean;
  canSpawn: boolean;
  inRangeOfRecycler: boolean;
  visited: boolean;
}

abstract class Island {
  private _cells: Cell[] = [];

  constructor(cells: Cell[]) {
    this._cells = cells;
  }

  get cells() {
    return this._cells;
  }

  abstract getBuildActions(): BuildAction[];
  abstract getMoveActions(): MoveAction[];
  abstract getSpawnActions(maxNumberOfSpawnActions: number): SpawnAction[];

  generateBuildActions(
    allowedToBuild: boolean,
    matter: number,
    costToBuildOrSpawn: number,
    decrementMatter: (amount: number) => void
  ): BuildAction[] {
    if (matter < costToBuildOrSpawn || !allowedToBuild) return [];
    const buildActions = this.getBuildActions();
    decrementMatter(buildActions.length * costToBuildOrSpawn);
    return buildActions;
  }

  generateMoveActions(): MoveAction[] {
    return this.getMoveActions();
  }

  generateSpawnActions(
    matter: number,
    costToBuildOrSpawn: number,
    decrementMatter: (amount: number) => void
  ): SpawnAction[] {
    const maxNumberOfSpawnActions = Math.floor(matter / costToBuildOrSpawn);
    if (maxNumberOfSpawnActions < 1) return [];
    const spawnActions = this.getSpawnActions(maxNumberOfSpawnActions);
    decrementMatter(spawnActions.length * costToBuildOrSpawn);
    return spawnActions;
  }

  getMyCells() {
    return this.cells.filter((cell) => cell.owner === Owner.ME);
  }

  getMyPerimeterCells() {
    const myCells = this.getMyCells();
    return myCells.filter((cell) => {
      const northCell = this.cells.find(
        (c) =>
          c.coordinates.x === cell.coordinates.x &&
          c.coordinates.y === cell.coordinates.y - 1
      );
      const southCell = this.cells.find(
        (c) =>
          c.coordinates.x === cell.coordinates.x &&
          c.coordinates.y === cell.coordinates.y + 1
      );
      const eastCell = this.cells.find(
        (c) =>
          c.coordinates.x === cell.coordinates.x + 1 &&
          c.coordinates.y === cell.coordinates.y
      );
      const westCell = this.cells.find(
        (c) =>
          c.coordinates.x === cell.coordinates.x - 1 &&
          c.coordinates.y === cell.coordinates.y
      );
      if (northCell?.owner !== Owner.ME) return true;
      if (southCell?.owner !== Owner.ME) return true;
      if (eastCell?.owner !== Owner.ME) return true;
      if (westCell?.owner !== Owner.ME) return true;
      return false;
    });
  }

  getAdjacentCells(cell: Cell) {
    return this.cells.filter((c) => {
      if (
        c.coordinates.x === cell.coordinates.x - 1 &&
        c.coordinates.y === cell.coordinates.y
      )
        return true;
      if (
        c.coordinates.x === cell.coordinates.x + 1 &&
        c.coordinates.y === cell.coordinates.y
      )
        return true;
      if (
        c.coordinates.y === cell.coordinates.y - 1 &&
        c.coordinates.x === cell.coordinates.x
      )
        return true;
      if (
        c.coordinates.y === cell.coordinates.y + 1 &&
        c.coordinates.x === cell.coordinates.x
      )
        return true;
      return false;
    });
  }

  getEnemyPerimeterCells() {
    const enemyCells = this.getEnemyCells();
    return enemyCells.filter((cell) => {
      const northCell = this.cells.find(
        (c) =>
          c.coordinates.x === cell.coordinates.x &&
          c.coordinates.y === cell.coordinates.y - 1
      );
      const southCell = this.cells.find(
        (c) =>
          c.coordinates.x === cell.coordinates.x &&
          c.coordinates.y === cell.coordinates.y + 1
      );
      const eastCell = this.cells.find(
        (c) =>
          c.coordinates.x === cell.coordinates.x + 1 &&
          c.coordinates.y === cell.coordinates.y
      );
      const westCell = this.cells.find(
        (c) =>
          c.coordinates.x === cell.coordinates.x - 1 &&
          c.coordinates.y === cell.coordinates.y
      );
      if (northCell?.owner !== Owner.FOE) return true;
      if (southCell?.owner !== Owner.FOE) return true;
      if (eastCell?.owner !== Owner.FOE) return true;
      if (westCell?.owner !== Owner.FOE) return true;
      return false;
    });
  }

  getEnemyCells() {
    return this.cells.filter((cell) => cell.owner === Owner.FOE);
  }

  getNuetralCells() {
    return this.cells.filter((cell) => cell.owner === Owner.NEUTRAL);
  }

  getMyRobotCells() {
    return this.cells.filter(
      (cell) => cell.units > 0 && cell.owner === Owner.ME
    );
  }

  getEnemyRobotCells() {
    return this.cells.filter(
      (cell) => cell.units > 0 && cell.owner === Owner.FOE
    );
  }
}

class IslandOnlyMe extends Island {
  constructor(cells: Cell[]) {
    super(cells);
  }

  getBuildActions(): BuildAction[] {
    return [];
  }

  getMoveActions(): MoveAction[] {
    return [];
  }

  getSpawnActions(maxNumberOfSpawnActions: number): SpawnAction[] {
    return [];
  }
}

class IslandWithMeAndEnemy extends Island {
  constructor(cells: Cell[]) {
    super(cells);
  }

  getBuildActions(): BuildAction[] {
    const myPerimeterCells = this.getMyPerimeterCells();
    if (myPerimeterCells.length === 0) return [];

    const enemyRobotCells = this.getEnemyRobotCells();
    const potentialRecyclerCells = myPerimeterCells
      .filter((cell) => cell.canBuild)
      .map((cell) => {
        const northCellScrapAmount =
          this.cells.find(
            (cell) =>
              cell.coordinates.x === cell.coordinates.x &&
              cell.coordinates.y === cell.coordinates.y - 1
          )?.scrapAmount ?? 0;
        const southCellScrapAmount =
          this.cells.find(
            (cell) =>
              cell.coordinates.x === cell.coordinates.x &&
              cell.coordinates.y === cell.coordinates.y + 1
          )?.scrapAmount ?? 0;
        const eastCellScrapAmount =
          this.cells.find(
            (cell) =>
              cell.coordinates.x === cell.coordinates.x + 1 &&
              cell.coordinates.y === cell.coordinates.y
          )?.scrapAmount ?? 0;
        const westCellScrapAmount =
          this.cells.find(
            (cell) =>
              cell.coordinates.x === cell.coordinates.x - 1 &&
              cell.coordinates.y === cell.coordinates.y
          )?.scrapAmount ?? 0;
        const totalScrapAmount =
          cell.scrapAmount +
          northCellScrapAmount +
          southCellScrapAmount +
          eastCellScrapAmount +
          westCellScrapAmount;

        const distance =
          getClosestCells([cell], enemyRobotCells)?.[0]?.distance ?? -1;

        return { cell, totalScrapAmount, distance };
      })
      .filter((cell) => cell.distance >= 0 && cell.distance <= 1)
      .sort((a, b) => b.totalScrapAmount - a.totalScrapAmount);

    if (potentialRecyclerCells.length === 0) return [];

    const potentialRecyclerCell = potentialRecyclerCells[0].cell;
    const buildAction = new BuildAction(potentialRecyclerCell.coordinates);
    return [buildAction];
  }

  getMoveActions(): MoveAction[] {
    const myRobotCells = this.getMyRobotCells();
    if (myRobotCells.length === 0) return [];
    let enemyCells = this.getEnemyCells();
    let moveActions: MoveAction[] = [];
    for (const robotCell of myRobotCells) {
      let robotUnits = robotCell.units;
      const possibleCellsToMoveTo = this.getAdjacentCells(robotCell);
      const closestCells = getClosestCells(
        possibleCellsToMoveTo,
        enemyCells
      ).sort((a, b) => {
        if (a.from.owner === Owner.FOE) return 1;
        if (b.from.owner === Owner.FOE) return -1;
        if (a.from.owner === Owner.NEUTRAL) return 1;
        if (b.from.owner === Owner.NEUTRAL) return -1;
        if (a.from.owner === Owner.ME) return -1;
        if (b.from.owner === Owner.ME) return 1;
        return 0;
      });

      const tempClosestCells = [...closestCells].filter(
        (cell) => cell.from.owner !== Owner.ME
      );
      for (let unit = 0; unit < robotCell.units; unit++) {
        let closestCell: { from: Cell; to: Cell; distance: number };
        for (const cell of tempClosestCells) {
          closestCell = tempClosestCells.shift();
          if (!closestCell) {
            closestCell = closestCells[0];
            break;
          }
          const alreadyMovingToCell = moveActions.find(
            (action) =>
              action.toX === closestCell.from.coordinates.x &&
              action.toY === closestCell.from.coordinates.y
          );
          console.error({ alreadyMovingToCell });
          if (!alreadyMovingToCell) break;
        }

        if (!closestCell) {
          closestCell = closestCells[closestCells.length - 1];
        }

        if (
          closestCell.distance <= 1 &&
          robotUnits <= 1 &&
          closestCell.from.units > 0 &&
          closestCell.from.owner === Owner.FOE
        )
          continue;

        // if possible cells to move to is enemy cell, move to it

        // if possible cells to move to is nuetral cell, move to it

        // if possible cells to move to is my cell, move to it
        const moveAction = new MoveAction({
          amount: 1,
          fromX: robotCell.coordinates.x,
          fromY: robotCell.coordinates.y,
          toX: closestCell.from.coordinates.x,
          toY: closestCell.from.coordinates.y,
        });
        moveActions.push(moveAction);
        robotUnits--;
      }
    }
    return moveActions;
  }

  getSpawnActions(maxNumberOfSpawnActions: number): SpawnAction[] {
    const myPerimeterCells = this.getMyPerimeterCells().filter(
      (cell) => cell.canSpawn
    );
    if (myPerimeterCells.length === 0) return [];
    // const nuetralCells = this.getNuetralCells();
    let enemyPerimeterCells = this.getEnemyPerimeterCells();
    let spawnActions: SpawnAction[] = [];
    const closestPerimeterEnemyCells = getClosestCells(
      myPerimeterCells,
      enemyPerimeterCells
    ).sort((a, b) => a.from.units - b.from.units);
    // const closestPerimeterNuetralCells = getClosestCells(
    //   myPerimeterCells,
    //   nuetralCells
    // ).sort((a, b) => a.from.units - b.from.units);
    let closestPerimeterCells = [
      ...closestPerimeterEnemyCells,
      // ...closestPerimeterNuetralCells,
    ];
    for (let i = 0; i < maxNumberOfSpawnActions; i++) {
      const closestPerimeterCell = closestPerimeterCells.shift();
      if (!closestPerimeterCell) break;
      const spawnAction = new SpawnAction({
        amount: 1,
        x: closestPerimeterCell.from.coordinates.x,
        y: closestPerimeterCell.from.coordinates.y,
      });
      spawnActions.push(spawnAction);
    }
    return spawnActions;
  }
}

class IslandWithMeAndNeutral extends Island {
  constructor(cells: Cell[]) {
    super(cells);
  }

  getBuildActions(): BuildAction[] {
    return [];
  }

  getMoveActions(): MoveAction[] {
    const myRobotCells = this.getMyRobotCells();
    if (myRobotCells.length === 0) return [];
    let nuetralCells = this.getNuetralCells();
    let moveActions: MoveAction[] = [];
    for (const robotCell of myRobotCells) {
      const closestCells = getClosestCells([robotCell], nuetralCells);
      for (let unit = 0; unit < robotCell.units; unit++) {
        const closestCell = closestCells.shift();
        if (!closestCell) break;
        const moveAction = new MoveAction({
          amount: 1,
          fromX: robotCell.coordinates.x,
          fromY: robotCell.coordinates.y,
          toX: closestCell.to.coordinates.x,
          toY: closestCell.to.coordinates.y,
        });
        moveActions.push(moveAction);
      }
    }
    return moveActions;
  }

  getSpawnActions(maxNumberOfSpawnActions: number): SpawnAction[] {
    const myTotalRobots = this.getMyRobotCells().length;
    if (myTotalRobots > 0) return [];
    const myCells = this.getMyCells();
    const nuetralCells = this.getNuetralCells();
    const closestCell = getClosestCells(myCells, nuetralCells)[0].from;
    const spawnAction = new SpawnAction({
      amount: 1,
      x: closestCell.coordinates.x,
      y: closestCell.coordinates.y,
    });
    return [spawnAction];
  }
}

class GameState {
  /** Game properties */
  private readonly RECYCLER_AND_SPAWN_COST: number = 10;
  private readonly _height: number;
  private readonly _width: number;
  private _myMatter: number;
  private _oppMatter: number;
  private _cells: Cell[][] = [[]];
  private _islands: Island[] = [];

  constructor(height: number, width: number) {
    this._height = height;
    this._width = width;
  }

  get height() {
    return this._height;
  }

  get width() {
    return this._width;
  }

  get myMatter() {
    return this._myMatter;
  }

  set myMatter(myMatter: number) {
    this._myMatter = myMatter;
  }

  decremenMyMatter = (amount: number) => {
    console.error({ matt: this.myMatter, amount });
    this.myMatter = this.myMatter - amount;
  };

  get oppMatter() {
    return this._oppMatter;
  }

  set oppMatter(oppMatter: number) {
    this._oppMatter = oppMatter;
  }

  get cells() {
    return this._cells;
  }

  set cells(cells: Cell[][]) {
    this._cells = cells;
  }

  get islands() {
    return this._islands;
  }

  set islands(islands: Island[]) {
    this._islands = islands;
  }

  clearCells() {
    this._cells = [];
  }

  addCell(cell: Cell) {
    if (!Array.isArray(this.cells[cell.coordinates.x])) {
      this.cells[cell.coordinates.x] = [];
    }
    this.cells[cell.coordinates.x][cell.coordinates.y] = cell;
  }

  findIslands() {
    let islands: Island[] = [];
    let islandCells: Cell[] = [];

    const isValidCell = (cell: Cell) => {
      return cell.scrapAmount > 0 && !cell.visited && !cell.recycler;
    };

    const dfs = (i, j) => {
      if (
        i >= 0 &&
        j >= 0 &&
        i < this.cells.length &&
        j < this.cells[i].length &&
        isValidCell(this.cells[i][j])
      ) {
        this.cells[i][j].visited = true;
        islandCells = [...islandCells, this.cells[i][j]];
        dfs(i + 1, j);
        dfs(i, j + 1);
        dfs(i - 1, j);
        dfs(i, j - 1);
      }
    };

    for (let i = 0; i < this.cells.length; i += 1) {
      for (let j = 0; j < this.cells[i].length; j += 1) {
        if (isValidCell(this.cells[i][j])) {
          dfs(i, j);
          if (islandCells.length === 0) continue;
          const totalIslandCells = islandCells.length;
          const myCellsLength = islandCells.filter(
            (cell) => cell.owner === Owner.ME
          ).length;
          const enemyCellsLength = islandCells.filter(
            (cell) => cell.owner === Owner.FOE
          ).length;
          const nuetralCellsLength = islandCells.filter(
            (cell) => cell.owner === Owner.NEUTRAL
          ).length;

          const nuetralIsland = nuetralCellsLength === totalIslandCells;
          const enemyIsland = enemyCellsLength === totalIslandCells;

          if (nuetralIsland || enemyIsland || myCellsLength === 0) {
            islandCells = [];
            continue;
          }

          const myIsland = totalIslandCells === myCellsLength;
          const islandWithMeAndNuetral =
            myCellsLength + nuetralCellsLength === totalIslandCells;
          const islandWithMeAndEnemy =
            myCellsLength + enemyCellsLength + nuetralCellsLength ===
            totalIslandCells;
          if (myIsland) {
            console.error("myIsland");
            islands = [...islands, new IslandOnlyMe(islandCells)];
          } else if (islandWithMeAndNuetral) {
            console.error("IslandWithMeAndNeutral");
            islands = [...islands, new IslandWithMeAndNeutral(islandCells)];
          } else if (islandWithMeAndEnemy) {
            console.error("IslandWithMeAndEnemy");
            islands = [...islands, new IslandWithMeAndEnemy(islandCells)];
          }
          islandCells = [];
        }
      }
    }
    return islands.sort((a, b) => {
      if (a instanceof IslandWithMeAndEnemy) {
        return 1;
      }
      if (b instanceof IslandWithMeAndEnemy) {
        return -1;
      }
      if (
        a instanceof IslandWithMeAndEnemy &&
        b instanceof IslandWithMeAndEnemy
      ) {
        return b.cells.length - a.cells.length;
      }
      if (a instanceof IslandWithMeAndNeutral) {
        return 1;
      }
      if (b instanceof IslandWithMeAndNeutral) {
        return -1;
      }
      return 0;
    });
  }

  cleanUpTurn() {
    this.cells = [];
    this.islands = [];
  }

  getAllRecyclers() {
    let myRecyclers: Cell[] = [];
    let enemyRecyclers: Cell[] = [];
    for (let i = 0; i < this.cells.length; i += 1) {
      for (let j = 0; j < this.cells[i].length; j += 1) {
        if (this.cells[i][j].recycler) {
          if (this.cells[i][j].owner === Owner.ME) {
            myRecyclers = [...myRecyclers, this.cells[i][j]];
          } else if (this.cells[i][j].owner === Owner.FOE) {
            enemyRecyclers = [...enemyRecyclers, this.cells[i][j]];
          }
        }
      }
    }
    return { myRecyclers, enemyRecyclers };
  }

  processTurn() {
    const buildActions: BuildAction[] = [];
    const moveActions: MoveAction[] = [];
    const spawnActions: SpawnAction[] = [];
    const recyclers = this.getAllRecyclers();
    const allowedToBuild =
      recyclers.myRecyclers.length <= recyclers.enemyRecyclers.length + 1;
    this.islands = this.findIslands();
    for (const island of this.islands) {
      buildActions.push(
        ...island.generateBuildActions(
          allowedToBuild,
          this.myMatter,
          this.RECYCLER_AND_SPAWN_COST,
          this.decremenMyMatter
        )
      );
    }

    for (const buildAction of buildActions) {
      this.cells[buildAction.x][buildAction.y].recycler = true;
      const adjacentCells = getAdjacentCells(
        this.cells,
        this.cells[buildAction.x][buildAction.y],
        this.height,
        this.width
      );
      for (const cell of adjacentCells) {
        this.cells[cell.coordinates.x][cell.coordinates.y].inRangeOfRecycler =
          true;
      }
    }

    // reset cell state if wanting to find new islands
    // this.islands = this.findIslands();

    for (const island of this.islands) {
      moveActions.push(...island.generateMoveActions());
      spawnActions.push(
        ...island.generateSpawnActions(
          this.myMatter,
          this.RECYCLER_AND_SPAWN_COST,
          this.decremenMyMatter
        )
      );
    }

    const command = [...buildActions, ...moveActions, ...spawnActions]
      .map((action) => action.toString())
      .join("");
    this.cleanUpTurn();
    return command === "" ? "WAIT;" : command;
  }
}

const gameState = new GameState(height, width);

// game loop
while (true) {
  const inputs: string[] = readline().split(" ");
  const myMatter: number = parseInt(inputs[0]);
  const oppMatter: number = parseInt(inputs[1]);
  gameState.myMatter = myMatter;
  gameState.oppMatter = oppMatter;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const inputs: string[] = readline().split(" ");
      const scrapAmount: number = parseInt(inputs[0]);
      const owner: number = parseInt(inputs[1]); // 1 = me, 0 = foe, -1 = neutral
      const units: number = parseInt(inputs[2]);
      const recycler: number = parseInt(inputs[3]);
      const canBuild: number = parseInt(inputs[4]);
      const canSpawn: number = parseInt(inputs[5]);
      const inRangeOfRecycler: number = parseInt(inputs[6]);
      const cell: Cell = {
        coordinates: { x, y },
        scrapAmount,
        owner,
        units,
        recycler: recycler === 1,
        canBuild: canBuild === 1,
        canSpawn: canSpawn === 1,
        inRangeOfRecycler: inRangeOfRecycler === 1,
        visited: false,
      };
      gameState.addCell(cell);
    }
  }

  // Write an action using console.log()
  // To debug: console.error('Debug messages...');
  const command = gameState.processTurn();
  console.log(command);
  // console.log('WAIT');
}
