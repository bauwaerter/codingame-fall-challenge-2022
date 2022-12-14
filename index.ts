/**
 * Auto-generated code below aims at helping you parse
 * the standard input according to the problem statement.
 **/

var inputs: string[] = readline().split(" ");
const width: number = parseInt(inputs[0]);
const height: number = parseInt(inputs[1]);

interface Action {
  type: "MOVE" | "SPAWN" | "BUILD";
}

interface MoveAction extends Action {
  type: "MOVE";
  amount: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

interface SpawnAction extends Action {
  type: "SPAWN";
  amount: number;
  x: number;
  y: number;
}

interface BuildAction extends Action {
  type: "BUILD";
  x: number;
  y: number;
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
  protected _cells: Cell[] = [];

  constructor(cells: Cell[]) {
    this._cells = cells;
  }

  get cells() {
    return this._cells;
  }

  abstract getBuildActions(): BuildAction[];
  abstract getMoveActions(): MoveAction[];
  abstract getSpawnActions(): SpawnAction[];

  getRobotCells() {
    return this.cells.filter((cell) => cell.units > 0);
  }
}

class IslandWithMeAndEnemy extends Island {
  protected _myCells: Cell[] = [];
  protected _oppCells: Cell[] = [];
  protected _perimeterCells: Cell[] = [];

  constructor(cells: Cell[]) {
    super(cells);
  }

  getBuildActions(): BuildAction[] {
    return [];
  }

  getMoveActions(): MoveAction[] {
    return [];
  }

  getSpawnActions(): SpawnAction[] {
    return [];
  }
}

class IslandWithMeAndNeutral extends Island {
  protected _cells: Cell[] = [];

  constructor(cells: Cell[]) {
    super(cells);
    this._cells = cells;
  }

  getBuildActions(): BuildAction[] {
    return [];
  }

  getMoveActions(): MoveAction[] {
    return [];
  }

  getSpawnActions(): SpawnAction[] {
    return [];
  }
}

class IslandWithMe extends Island {
  protected _cells: Cell[] = [];

  constructor(cells: Cell[]) {
    super(cells);
    this._cells = cells;
  }

  getBuildActions(): BuildAction[] {
    return [];
  }

  getMoveActions(): MoveAction[] {
    return [];
  }

  getSpawnActions(): SpawnAction[] {
    return [];
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

  private createBuildCommand(coordinates: Coordinates) {
    return `BUILD ${coordinates.x} ${coordinates.y};`;
  }

  private createMoveCommand({
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
    return `MOVE ${amount} ${fromX} ${fromY} ${toX} ${toY};`;
  }

  private createSpawnCommand(amount: number, coordinates: Coordinates) {
    return `SPAWN ${amount} ${coordinates.x} ${coordinates.y};`;
  }

  calculateDistance(aCoord: Coordinates, bCoord: Coordinates) {
    const x = Math.abs(bCoord.x - aCoord.x);
    const y = Math.abs(bCoord.y - aCoord.y);
    return x + y;
  }

  getDistances(fromCellArr: Cell[], toCellArr: Cell[]) {
    let distanceArr: { from: Cell; to: Cell; distance: number }[] = [];
    for (let fromCell of fromCellArr) {
      for (let toCell of toCellArr) {
        const distance = this.calculateDistance(
          fromCell.coordinates,
          toCell.coordinates
        );
        distanceArr = [
          ...distanceArr,
          { from: fromCell, to: toCell, distance },
        ];
      }
    }
    return distanceArr;
  }

  // checkAdjacentCellsForUnits(cell: Cell) {
  //   const adjacentCells = this.getAdjacentCells(cell);
  //   const hasUnits = adjacentCells.filter((cell) => cell.units > 0);
  //   if (hasUnits) {
  //     return false;
  //   }
  //   return true;
  // }

  // checkAdjacentCellsForGrass(cell: Cell) {
  //   const adjacentCells = this.getAdjacentCells(cell);
  //   const hasGrass = adjacentCells.filter((cell) => cell.scrapAmount === 0);
  //   if (hasGrass.length > 0) {
  //     return true;
  //   }
  //   return false;
  // }

  checkAdjacentCellsForEnemyCells(cell: Cell) {
    const adjacentCells = this.getAdjacentCells(cell);
    const enemyCellLength = adjacentCells.filter(
      (cell) => cell.owner === Owner.FOE
    );
    if (enemyCellLength.length > 0) {
      return true;
    }
    return false;
  }

  buildRecycler(myMatter: number): string[] {
    const commands: string[] = [];
    if (myMatter < this.RECYCLER_AND_SPAWN_COST) {
      return [];
    }

    for (const island of this.islands) {
      if (
        island.cells.every(
          (cell) => cell.owner === Owner.ME || cell.owner === Owner.NEUTRAL
        )
      )
        continue;
      const potentialCells = island.cells
        .filter(
          (cell) =>
            !cell.recycler &&
            !cell.inRangeOfRecycler &&
            cell.canBuild &&
            this.checkAdjacentCellsForEnemyCells(cell)
        )
        .sort((a, b) => {
          return b.scrapAmount - a.scrapAmount;
        });
      if (potentialCells.length === 0) {
        continue;
      }
      const recyclerCell = potentialCells[0];
      const buildCommand = this.createBuildCommand(recyclerCell.coordinates);
      commands.push(buildCommand);
    }
    return commands;
  }

  getAdjacentCells(cell: Cell): Cell[] {
    let adjacentCells: Cell[] = [];
    if (cell.coordinates.x > 0) {
      adjacentCells.push(
        this.cells[cell.coordinates.x - 1][cell.coordinates.y]
      );
    }
    if (cell.coordinates.x < this.width - 1) {
      adjacentCells.push(
        this.cells[cell.coordinates.x + 1][cell.coordinates.y]
      );
    }
    if (cell.coordinates.y > 0) {
      adjacentCells.push(
        this.cells[cell.coordinates.x][cell.coordinates.y - 1]
      );
    }
    if (cell.coordinates.y < this.height - 1) {
      adjacentCells.push(
        this.cells[cell.coordinates.x][cell.coordinates.y + 1]
      );
    }
    return adjacentCells.filter(
      (cell) => cell.scrapAmount > 0 && !cell.recycler
    );
  }

  moveRobots(): string[] {
    const commands: string[] = [];

    for (const island of this.islands) {
      if (island.isIslandAllOwnedByMe) {
        continue;
      }
      const myRobotCells = island.getMyRobotCells();
      const nuetralCells = island.getNuetralCells();
      if (island.isIslandOwnedByMeWithNeutralCells) {
        const tempNuetralCells = [...nuetralCells];
        for (const robot of myRobotCells) {
          if (tempNuetralCells.length === 0) break;
          const moveToNuetralCell = tempNuetralCells.shift();
          if (!moveToNuetralCell) break;
          const moveCommand = this.createMoveCommand({
            amount: robot.units,
            fromX: robot.coordinates.x,
            fromY: robot.coordinates.y,
            toX: moveToNuetralCell.coordinates.x,
            toY: moveToNuetralCell.coordinates.y,
          });
          commands.push(moveCommand);
        }
        continue;
      }

      const oppCells = island.getOppCells();

      for (const myRobotCell of myRobotCells) {
        const adjacentCells = this.getAdjacentCells(myRobotCell);
        const enemyCells = adjacentCells.filter(
          (cell) => cell.owner === Owner.FOE
        );
        if (enemyCells.length > 0) {
          const moveCommand = this.createMoveCommand({
            amount: myRobotCell.units,
            fromX: myRobotCell.coordinates.x,
            fromY: myRobotCell.coordinates.y,
            toX: enemyCells[0].coordinates.x,
            toY: enemyCells[0].coordinates.y,
          });
          console.error("moving to enemy cell");
          commands.push(moveCommand);
          continue;
        }
        const nuetralCells = adjacentCells.filter(
          (cell) => cell.owner === Owner.NEUTRAL
        );
        if (nuetralCells.length > 0) {
          const moveCommand = this.createMoveCommand({
            amount: myRobotCell.units,
            fromX: myRobotCell.coordinates.x,
            fromY: myRobotCell.coordinates.y,
            toX: nuetralCells[0].coordinates.x,
            toY: nuetralCells[0].coordinates.y,
          });
          console.error("moving to nuetral cell");
          commands.push(moveCommand);
          continue;
        }
        const moveToClosestOppCell = this.getDistances(
          [myRobotCell],
          oppCells
        ).sort((a, b) => a.distance - b.distance);
        if (moveToClosestOppCell.length > 0) {
          const moveCommand = this.createMoveCommand({
            amount: myRobotCell.units,
            fromX: myRobotCell.coordinates.x,
            fromY: myRobotCell.coordinates.y,
            toX: moveToClosestOppCell[0].to.coordinates.x,
            toY: moveToClosestOppCell[0].to.coordinates.y,
          });
          console.error("moving to closest opp cell");
          commands.push(moveCommand);
          continue;
        }
        const moveToClosestNuetralCell = this.getDistances(
          [myRobotCell],
          nuetralCells
        ).sort((a, b) => a.distance - b.distance);
        if (moveToClosestNuetralCell.length > 0) {
          const moveCommand = this.createMoveCommand({
            amount: myRobotCell.units,
            fromX: myRobotCell.coordinates.x,
            fromY: myRobotCell.coordinates.y,
            toX: moveToClosestNuetralCell[0].to.coordinates.x,
            toY: moveToClosestNuetralCell[0].to.coordinates.y,
          });
          console.error("moving to closest nuetral cell");
          commands.push(moveCommand);
          continue;
        }
      }
    }

    return commands;
  }

  spawnRobots(myMatter: number): string[] {
    console.error({ myMatter });
    const commands: string[] = [];
    if (myMatter < this.RECYCLER_AND_SPAWN_COST) {
      return [];
    }
    const spawnRobotLimit = Math.floor(myMatter / this.RECYCLER_AND_SPAWN_COST);
    const maxSpawn = spawnRobotLimit;

    if (maxSpawn <= 0) return [];
    console.error({ maxSpawn });

    for (const island of this.islands) {
      if (island.isIslandAllOwnedByMe) continue;
      const myRobotCells = island.getMyRobotCells();
      if (
        island.isIslandOwnedByMeWithNeutralCells &&
        myRobotCells.length === 0
      ) {
        const spawnCommand = this.createSpawnCommand(
          1,
          myRobotCells[0].coordinates
        );
        console.error("spawning on isIslandOwnedByMeWithNeutralCells cell");
        commands.push(spawnCommand);
        continue;
      }
      const myCells = island.getMyCells();
      const enemyRobots = island.getOppRobotCells();
      const closestRobots = this.getDistances(myCells, enemyRobots).sort(
        (a, b) => a.distance - b.distance
      );
      if (closestRobots.length === 0) {
        return [];
      }
      for (let i = 0; i < maxSpawn; i++) {
        const closestRobot = closestRobots.shift();
        if (!closestRobot) continue;
        const adjacentCells = this.getAdjacentCells(closestRobot.from).filter(
          (cell) => cell.scrapAmount > 0
        );
        if (adjacentCells.length === 0) return [];
        const spawnCommand = this.createSpawnCommand(
          1,
          closestRobot.from.coordinates
        );
        console.error("spawning on closestRobot cell");
        commands.push(spawnCommand);
      }
    }

    return commands;
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
          islands = [...islands, new Island(islandCells)];
          islandCells = [];
        }
      }
    }
    return islands;
  }

  cleanUpTurn() {
    this.cells = [];
    this.islands = [];
  }

  processTurn() {
    this.islands = this.findIslands();
    let myMatter = this.myMatter;

    for (const island of this.islands) {
    }

    const buildRecyclerCommand = this.buildRecycler(myMatter);
    myMatter =
      myMatter - buildRecyclerCommand.length * this.RECYCLER_AND_SPAWN_COST;
    const spawnRobotsCommand = this.spawnRobots(myMatter);
    const moveRobotsCommand = this.moveRobots();

    const command = [
      buildRecyclerCommand,
      moveRobotsCommand,
      spawnRobotsCommand,
    ]
      .flatMap((c) => c)
      .join("");

    this.cleanUpTurn();
    return command;
  }
}

const gameState = new GameState(height, width);
let tick = 0;
// game loop
while (true) {
  var inputs: string[] = readline().split(" ");
  const myMatter: number = parseInt(inputs[0]);
  const oppMatter: number = parseInt(inputs[1]);
  gameState.myMatter = myMatter;
  gameState.oppMatter = oppMatter;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      var inputs: string[] = readline().split(" ");
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
