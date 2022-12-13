/**
 * Auto-generated code below aims at helping you parse
 * the standard input according to the problem statement.
 **/

const readline = (): string => {
  return "";
};

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
}

class GameState {
  private _height: number;
  private _width: number;
  private _myMatter: number;
  private _oppMatter: number;
  private _cells: Map<string, Cell>;

  constructor(height: number, width: number) {
    this._height = height;
    this._width = width;
    this._cells = new Map();
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

  private set cells(cells: Map<string, Cell>) {
    this._cells = cells;
  }

  private getMyCells() {
    return new Map([...this._cells].filter(([_, v]) => v.owner === Owner.ME));
  }

  private getMyRobotCells() {
    return new Map(
      [...this._cells].filter(([_, v]) => v.owner === Owner.ME && v.units > 0)
    );
  }

  private getMySpawnCells() {
    return new Map(
      [...this._cells].filter(([_, v]) => v.owner === Owner.ME && v.canSpawn)
    );
  }

  private getOppRobotCells() {
    return new Map(
      [...this._cells].filter(([_, v]) => v.owner === Owner.FOE && v.units > 0)
    );
  }

  private getMyRecyclers() {
    return new Map(
      [...this._cells].filter(([_, v]) => v.owner === Owner.ME && v.recycler)
    );
  }

  private getOppRecyclers() {
    return new Map(
      [...this._cells].filter(([_, v]) => v.owner === Owner.FOE && v.recycler)
    );
  }

  private getOppCells() {
    return new Map([...this._cells].filter(([_, v]) => v.owner === Owner.FOE));
  }

  private getNeutralCells() {
    return new Map(
      [...this._cells].filter(([_, v]) => v.owner === Owner.NEUTRAL)
    );
  }

  private getGrassCells() {
    return new Map([...this._cells].filter(([_, v]) => v.scrapAmount === 0));
  }

  private getMapKey(coordinates: Coordinates) {
    return `${coordinates.x}-${coordinates.y}`;
  }

  addOrUpdateCell(cell: Cell) {
    this._cells.set(this.getMapKey(cell.coordinates), cell);
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

  calculateDistance(aCoord: Coordinates, bCoord: Coordinates) {
    const x = Math.pow(bCoord.x - aCoord.x, 2);
    const y = Math.pow(bCoord.y - aCoord.y, 2);
    const distance = Math.sqrt(x + y);
    return distance;
  }

  findNearestEnemyRobot() {
    const enemyRobots = this.getOppRobotCells();
  }

  moveToEnemyRobots() {
    const enemyRobots = this.getOppRobotCells();
  }

  moveToEnemyRecyclers() {
    const enemyRecyclers = this.getOppRecyclers();
  }

  getDistances(fromMap: Map<Coordinates, Cell>, toMap: Map<Coordinates, Cell>) {
    let distanceArr: { from: Cell; to: Cell; distance: number }[] = [];
    for (let [key, fromCell] of fromMap) {
      for (let [oppKey, toCell] of toMap) {
        const distance = this.calculateDistance(
          fromCell.coordinates,
          toCell.coordinates
        );
        distanceArr.push({ from: fromCell, to: toCell, distance });
      }
    }
    return distanceArr;
  }

  private createSpawnCommand(amount: number, coordinates: Coordinates) {
    return `SPAWN ${amount} ${coordinates.x} ${coordinates.y};`;
  }

  hasUnits(cell: Cell | undefined) {
    if (!cell) return false;
    return cell.units > 0;
  }

  checkAdjacentCellsForUnits(cell: Cell) {
    const adjacentCells = this.getAdjacentCells(cell);
    const hasUnits = adjacentCells.filter((cell) => cell.units > 0);
    if (hasUnits) {
      return false;
    }
    return true;
  }

  checkAdjacentCellsForGrass(cell: Cell) {
    const adjacentCells = this.getAdjacentCells(cell);
    const hasGrass = adjacentCells.filter((cell) => cell.scrapAmount === 0);
    if (hasGrass) {
      return true;
    }
    return false;
  }

  buildRecycler(myMatter: number): string[] {
    const commands = [];
    if (myMatter < 10 || myMatter > 25) {
      return [];
    }
    const myRecyclers = [...this.getMyRecyclers().values()];
    if (myRecyclers.length >= 3) {
      return [];
    }

    const myCells = this.getMyCells();
    const potentialCells = [...myCells.values()]
      .filter(
        (cell) =>
          !cell.recycler &&
          !cell.inRangeOfRecycler &&
          cell.canBuild &&
          this.checkAdjacentCellsForGrass(cell)
      )
      .sort((a, b) => {
        // const aCellsAdjacent = this.getAdjacentCells(a).filter(cell => cell.owner === Owner.FOE)
        // const bCellsAdjacent = this.getAdjacentCells(b).filter(cell => cell.owner === Owner.FOE)
        // if(aCellsAdjacent.length < bCellsAdjacent.length) {
        //     return -1
        // }
        // if(aCellsAdjacent.length > bCellsAdjacent.length) {
        //     return 1
        // }
        return b.scrapAmount - a.scrapAmount;
      });
    if (potentialCells.length === 0) {
      return [];
    }
    const recyclerCell = potentialCells[0];
    commands.push(this.createBuildCommand(recyclerCell.coordinates));
    return commands;
  }

  getAdjacentCells(cell: Cell) {
    return [
      this.cells.get(
        this.getMapKey({ x: cell.coordinates.x, y: cell.coordinates.y + 1 })
      ),
      this.cells.get(
        this.getMapKey({ x: cell.coordinates.x, y: cell.coordinates.y - 1 })
      ),
      this.cells.get(
        this.getMapKey({ x: cell.coordinates.x - 1, y: cell.coordinates.y })
      ),
      this.cells.get(
        this.getMapKey({ x: cell.coordinates.x + 1, y: cell.coordinates.y })
      ),
    ].filter((cell) => cell !== undefined);
  }

  getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

  moveRobots(): string[] {
    const commands: string[] = [];
    const myRobotCells = this.getMyRobotCells();
    const oppCells = this.getOppRobotCells();
    let moves: { from: Cell; to: Cell }[] = [];
    for (let [key, cell] of myRobotCells) {
      // let currentLowestDistance = Number.MAX_SAFE_INTEGER
      // for(let [oppKey, oppCell] of oppCells) {
      //     const distance = this.calculateDistance(cell.coordinates, oppCell.coordinates)
      //     if(distance < currentLowestDistance) {
      //         moves = moves.filter(c => c.from.coordinates.x === cell.coordinates.x && c.from.coordinates.y === cell.coordinates.y)
      //         moves.push({ from: cell, to: oppCell, distance })
      //     }
      // }
      const adjacentCells = this.getAdjacentCells(cell).filter(
        (cell) => cell.scrapAmount > 0
      );
      const sortedByScrapAmountCells = adjacentCells.sort((a, b) => {
        if (a.owner < b.owner) {
          return -1;
        } else if (a.owner > b.owner) {
          return 1;
        }

        // if(a.scrapAmount < b.scrapAmount) {
        //     return 1
        // } else if(a.scrapAmount > b.scrapAmount) {
        //     return -1
        // }
        return 0;
      });
      if (sortedByScrapAmountCells.length === 0) continue;
      for (let index = 0; index < sortedByScrapAmountCells.length; index++) {
        const moveToCell = moves.find(
          (m) =>
            m.to.coordinates.x ===
              sortedByScrapAmountCells[index].coordinates.x &&
            m.to.coordinates.y === sortedByScrapAmountCells[index].coordinates.y
        );
        if (!moveToCell) {
          moves.push({ from: cell, to: sortedByScrapAmountCells[index] });
          break;
        }
        if (index === sortedByScrapAmountCells.length - 1) {
          const randomMove = this.getRandomInt(
            sortedByScrapAmountCells.length - 1
          );
          moves.push({ from: cell, to: sortedByScrapAmountCells[randomMove] });
          break;
        }
      }
    }

    for (const move of moves) {
      const moveCommand = this.createMoveCommand({
        amount: move.from.units,
        fromX: move.from.coordinates.x,
        fromY: move.from.coordinates.y,
        toX: move.to.coordinates.x,
        toY: move.to.coordinates.y,
      });
      commands.push(moveCommand);
    }

    return commands;
  }

  spawnRobots(myMatter: number): string[] {
    const commands: string[] = [];
    if (myMatter < 10) {
      return [];
    }
    const spawnRobotLimit = myMatter % 10;
    const maxSpawn = spawnRobotLimit;
    const myRobotCells = this.getMyRobotCells();
    const enemyRobots = this.getOppRobotCells();
    let distanceArr: { from: Cell; to: Cell; distance: number }[] = [];
    for (let [key, cell] of myRobotCells) {
      for (let [oppKey, oppCell] of enemyRobots) {
        const distance = this.calculateDistance(
          cell.coordinates,
          oppCell.coordinates
        );
        distanceArr.push({ from: cell, to: oppCell, distance });
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
      if (adjacentCells.length === 0) return;
      const spawnCommand = this.createSpawnCommand(
        1,
        closestRobot.from.coordinates
      );
      commands.push(spawnCommand);
    }

    return commands;
  }

  processTurn() {
    let myMatter = this.myMatter;
    const buildRecyclerCommand = this.buildRecycler(myMatter);
    myMatter = myMatter - buildRecyclerCommand.length * 10;
    const spawnRobotsCommand = this.spawnRobots(myMatter);
    const moveRobotsCommand = this.moveRobots();

    const command = [
      buildRecyclerCommand,
      moveRobotsCommand,
      spawnRobotsCommand,
    ]
      .flatMap((c) => c)
      .join("");
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
      };
      gameState.addOrUpdateCell(cell);
    }
  }

  // Write an action using console.log()
  // To debug: console.error('Debug messages...');
  const command = gameState.processTurn();
  console.log(command);
  // console.log('WAIT');
}
