/**
 * Auto-generated code below aims at helping you parse
 * the standard input according to the problem statement.
 **/

var inputs: string[] = readline().split(" ");
const width: number = parseInt(inputs[0]);
const height: number = parseInt(inputs[1]);

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

class Island {
  private _cells: Cell[] = [];
  private _isActionable: boolean = false;

  constructor(cells: Cell[]) {
    this._cells = cells;
    this._isActionable = cells.some((cell) => cell.owner === Owner.ME);
  }

  get cells() {
    return this._cells;
  }

  get isActionable() {
    return this._isActionable;
  }

  get isIslandAllOwnedByMe() {
    return this.cells.every((cell) => cell.owner === Owner.ME);
  }

  get isIslandOwnedByMeWithNeutralCells() {
    return this.cells.every(
      (cell) => cell.owner === Owner.ME || cell.owner === Owner.NEUTRAL
    );
  }

  getMyRobotCells() {
    return this.cells.filter(
      (cell) => cell.owner === Owner.ME && cell.units > 0
    );
  }

  getOppRobotCells() {
    return this.cells.filter(
      (cell) => cell.owner === Owner.FOE && cell.units > 0
    );
  }

  getMyCells() {
    return this.cells.filter((cell) => cell.owner === Owner.ME);
  }

  getOppCells() {
    return this.cells.filter((cell) => cell.owner === Owner.FOE);
  }

  getNuetralCells() {
    return this.cells.filter((cell) => cell.owner === Owner.NEUTRAL);
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
    const x = Math.pow(bCoord.x - aCoord.x, 2);
    const y = Math.pow(bCoord.y - aCoord.y, 2);
    const distance = Math.sqrt(x + y);
    return distance;
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

  hasUnits(cell: Cell | undefined) {
    if (!cell) return false;
    return cell.units > 0;
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
    return [
      this.cells[cell.coordinates.x][cell.coordinates.y + 1],
      this.cells[cell.coordinates.x][cell.coordinates.y - 1],
      this.cells[cell.coordinates.x + 1][cell.coordinates.y],
      this.cells[cell.coordinates.x - 1][cell.coordinates.y],
    ].filter((cell) => cell !== undefined) as Cell[];
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
        const myRobotCellsDistanceToNuetralCells = this.getDistances(
          myRobotCells,
          nuetralCells
        ).sort((a, b) => a.distance - b.distance);
        const distinctRobotCells = [
          ...new Set(
            myRobotCellsDistanceToNuetralCells.map(
              (c) => c.from.coordinates.x + c.from.coordinates.y
            )
          ),
        ].map((key) =>
          myRobotCellsDistanceToNuetralCells.find(
            (c) => c.from.coordinates.x + c.from.coordinates.y === key
          )
        );
        for (const move of distinctRobotCells) {
          if (!move) continue;
          const moveCommand = this.createMoveCommand({
            amount: move.from.units,
            fromX: move.from.coordinates.x,
            fromY: move.from.coordinates.y,
            toX: move.to.coordinates.x,
            toY: move.to.coordinates.y,
          });
          commands.push(moveCommand);
        }
        continue;
      }

      const myCells = island.getMyCells();
      const oppCells = island.getOppCells();

      if (nuetralCells.length > myCells.length + oppCells.length) {
        const myRobotCellsDistanceToNuetralCells = this.getDistances(
          myRobotCells,
          nuetralCells
        ).sort((a, b) => a.distance - b.distance);
        const distinctRobotCells = [
          ...new Set(
            myRobotCellsDistanceToNuetralCells.map(
              (c) => c.from.coordinates.x + c.from.coordinates.y
            )
          ),
        ].map((key) =>
          myRobotCellsDistanceToNuetralCells.find(
            (c) => c.from.coordinates.x + c.from.coordinates.y === key
          )
        );
        for (const move of distinctRobotCells) {
          if (!move) continue;
          const moveCommand = this.createMoveCommand({
            amount: move.from.units,
            fromX: move.from.coordinates.x,
            fromY: move.from.coordinates.y,
            toX: move.to.coordinates.x,
            toY: move.to.coordinates.y,
          });
          commands.push(moveCommand);
        }
        continue;
      }

      const myRobotCellsDistanceToOppCells = this.getDistances(
        myRobotCells,
        oppCells
      ).sort((a, b) => a.distance - b.distance);
      const distinctRobotCells = [
        ...new Set(
          myRobotCellsDistanceToOppCells.map(
            (c) => c.from.coordinates.x + c.from.coordinates.y
          )
        ),
      ].map((key) =>
        myRobotCellsDistanceToOppCells.find(
          (c) => c.from.coordinates.x + c.from.coordinates.y === key
        )
      );
      for (const move of distinctRobotCells) {
        if (!move) continue;
        const moveCommand = this.createMoveCommand({
          amount: move.from.units,
          fromX: move.from.coordinates.x,
          fromY: move.from.coordinates.y,
          toX: move.to.coordinates.x,
          toY: move.to.coordinates.y,
        });
        commands.push(moveCommand);
      }
    }

    return commands;
  }

  spawnRobots(myMatter: number): string[] {
    const commands: string[] = [];
    if (myMatter < this.RECYCLER_AND_SPAWN_COST) {
      return [];
    }
    const spawnRobotLimit = myMatter % this.RECYCLER_AND_SPAWN_COST;
    const maxSpawn = spawnRobotLimit;

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
        commands.push(spawnCommand);
        continue;
      }
      const enemyRobots = island.getOppRobotCells();
      let distanceArr: { from: Cell; to: Cell; distance: number }[] = [];
      for (let robotCell of myRobotCells) {
        for (let oppCell of enemyRobots) {
          const distance = this.calculateDistance(
            robotCell.coordinates,
            oppCell.coordinates
          );
          distanceArr.push({ from: robotCell, to: oppCell, distance });
        }
      }
      const closestRobots = distanceArr.sort((a, b) => a.distance - b.distance);
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
          islands = [...this.islands, new Island(islandCells)];
          islandCells = [];
        }
      }
    }

    return islands;
  }

  processTurn() {
    this.islands = this.findIslands().filter(
      (island) => island.cells.length > 0 && island.isActionable
    );
    let myMatter = this.myMatter;

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

    this.clearCells();
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
        recycler: !!recycler,
        canBuild: !!canBuild,
        canSpawn: !!canSpawn,
        inRangeOfRecycler: !!inRangeOfRecycler,
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
