"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
function generateEntity(name, fileName) {
    const data = `import { v4 as uuid } from 'uuid';

export class ${name} {
  public id: string

  constructor(init: Partial<${name}>) {
    this.id = init.id || uuid()
  }
}`;
    (0, fs_1.mkdirSync)(`./src/domain/${fileName}`, { recursive: true });
    (0, fs_1.writeFileSync)(`./src/domain/${fileName}/${fileName}.entity.ts`, data);
}
function generateRepositoryInterface(name, fileName) {
    const data = `import { ${name} } from './${fileName}.entity';
import { ListOptions, ListResult } from '../domain.types';

export interface I${name}Repository {
  create(data: Partial<${name}>): Promise<${name}>;
  get(data: ListOptions<${name}>): Promise<${name} | null>;
  getById(id: string): Promise<${name}>;
  list(data?: ListOptions<${name}>): Promise<ListResult<${name}>>;
  update(id: string, data: Omit<Partial<${name}>, 'id'>): Promise<${name}>;
  delete(id: string): Promise<void>;
}`;
    (0, fs_1.writeFileSync)(`./src/domain/${fileName}/${fileName}.repository.i.ts`, data);
}
function generateRepository(name, objectName, fileName) {
    const data = `import { Injectable, Provider } from '@nestjs/common';
import { ${name} } from '../../../domain/${fileName}/${fileName}.entity';
import { ${name} as ${name}Model, Prisma } from '@prisma/client';
import { I${name}Repository } from '../../../domain/${fileName}/${fileName}.repository.i';
import { DatabaseService } from '../../database/database.service';
import { ListOptions, ListResult } from '../../../domain/domain.types';
import * as _ from 'lodash';
  
@Injectable()
class Repository implements I${name}Repository {
  constructor(private readonly databaseService: DatabaseService) { }
  
   private fromEntity(
    ${objectName}: Partial<${name}>,
  ): Omit<${name}Model, 'updatedAt'> {
    return {
      ...${objectName},
      createdAt: data.createdAt || undefined,
    } as ${name}Model;
  }

  private toEntity(data: ${name}Model): ${name} {
    return new ${name}({
      ...data,
    });
  }
  
  public async get(options: ListOptions<${name}> = {}): Promise<${name} | null> {
    const findFirstArgs = options ? this.buildIncomeFindManyArgs(options) : {};
    const ${objectName} = await this.databaseService.${objectName}.findFirst(findFirstArgs);

    return ${objectName} && this.toEntity(${objectName});
  }

  public async getById(id: string): Promise<${name}> {
    const ${objectName} = await this.databaseService.${objectName}.findUnique({
      where: { id },
    });

    return ${objectName} ? this.toEntity(${objectName}) : null;
  }

  public async list(options?: ListOptions<${name}>): Promise<ListResult<${name}>> {
    const findManyArgs = this.buildIncomeFindManyArgs(options);
    const ${objectName}s = await this.databaseService.${objectName}.findMany(findManyArgs);

    return {
      total: ${objectName}s.length,
      items: ${objectName}s.map(item => this.toEntity(item)),
    }
  }

  public async create(data: Partial<${name}>): Promise<${name}> {
    const ${objectName} = await this.databaseService.${objectName}.create({
      data: this.fromEntity(data),
    });

    return this.toEntity(${objectName});
  }

  public async update(id: string, data: Partial<${name}>): Promise<${name}> {
    const ${objectName} = await this.databaseService.${objectName}.update({
      where: { id },
      data,
    });

    return this.toEntity(${objectName});
  }

  public async delete(id: string): Promise<void> {
    await this.databaseService.${objectName}.delete({ where: { id } });
  }

  buildIncomeFindManyArgs(options?: ListOptions<${name}>): Prisma.${name}FindManyArgs {
    const findManyArgs: Prisma.${name}FindFirstArgs | Prisma.${name}FindManyArgs = {};
    
    if (options.filter) {
      findManyArgs.where = _.omitBy(options.filter, _.isUndefined.bind(_));
    }
    if (options.sort) findManyArgs.orderBy = options.sort;
    if (options.skip) findManyArgs.skip = options.skip;
    if (options.limit) findManyArgs.take = options.limit;

    return findManyArgs;
  }
}

export const ${name}Repository: Provider = {
  provide: '${name}Repository',
  useClass: Repository,
};
`;
    (0, fs_1.mkdirSync)(`./src/infra/repository/${fileName}`, { recursive: true });
    (0, fs_1.writeFileSync)(`./src/infra/repository/${fileName}/${fileName}.repository.ts`, data);
}
function generateModule(name, fileName) {
    const data = `import { Module } from '@nestjs/common';
import { RepositoryModule } from '../../infra/repository/repository.module';
import { ${name}Service } from './${fileName}.service';

@Module({
  imports: [RepositoryModule],
  providers: [${name}Service],
  exports: [${name}Service],
})
export class ${name}Module {}
`;
    (0, fs_1.writeFileSync)(`./src/domain/${fileName}/${fileName}.module.ts`, data);
}
function generateService(name, objectName, fileName) {
    const data = `import { Injectable, Inject } from '@nestjs/common';
import { ${name}Repository } from '../../infra/repository/${fileName}/${fileName}.repository';
import { ListOptions, ListResult } from '../domain.types';
import { I${name}Repository } from './${fileName}.repository.i';
import { ${name} } from './${fileName}.entity';

@Injectable()
export class ${name}Service {
  constructor(
    @Inject(${name}Repository)
    private readonly ${objectName}Repository: I${name}Repository
  ) { }

  async create(data: Partial<${name}>): Promise<${name}> {
    return this.${objectName}Repository.create(new ${name}(data));
  }

  async get(options: ListOptions<${name}>): Promise<${name}> {
    return this.${objectName}Repository.getById(id);
  }
   
  public async getById(id: string): Promise<${name}> {
    return this.${objectName}Repository.getById(id);
  }
  
  async list(data?: ListOptions<${name}>): Promise<ListResult<${name}>> {
    return this.${objectName}Repository.list(data);
  }

  async update(id: string, data: Partial<${name}>): Promise<${name}> {
    return this.${objectName}Repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.${objectName}Repository.delete(id);
  }
}
`;
    (0, fs_1.writeFileSync)(`./src/domain/${fileName}/${fileName}.service.ts`, data);
}
function generateDto(name, fileName) {
    const data = `import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested, IsUUID, IsPositive, IsInt, IsOptional, IsObject } from 'class-validator';
import { PartialType, PickType } from '@nestjs/swagger';
import { SortDirection } from '../../interfaces.types';

export class ${name} {
  @IsString() @IsUUID() @IsNotEmpty() id: string;
  // TODO: fill all the fields from entity ${name}
}


export class Create${name}Body extends PickType(${name}, [/* TODO: Fill in an array of fields that are required to create an entity */] as const) {}
export class Create${name}Response {
  @IsObject() data: ${name};
}

export class Get${name}Params extends PickType(${name}, ['id'] as const) {}
export class Get${name}Response {
  @IsObject() data: ${name};
}

export class List${name}sQuery {
  @IsNumber() @IsPositive() @IsInt() @IsOptional() readonly skip?: number;
  @IsNumber() @IsPositive() @IsInt() @IsOptional() readonly limit?: number;
  @IsString() @IsEnum(SortDirection) @IsOptional() readonly sort?: SortDirection;
  
  // TODO: Fill in all required search filters from ${name} entity fields
  @IsString() @IsEnum(SOME_FIELD_FROM_ENTITY_ENUM) @IsOptional() readonly SOME_FIELD_FROM_ENTITY?: SOME_FIELD_FROM_ENTITY_ENUM;
}
export class List${name}sResult {
  @IsNumber() @IsNotEmpty() readonly total: number;
  @IsArray() @ValidateNested({ each: true }) @Type(() => ${name}) readonly items: ${name}[];
}
export class List${name}sResponse {
  @IsObject() data: List${name}sResult;
}

export class Update${name}Params extends PickType(${name}, ['id'] as const) {}
export class Update${name}Body extends PartialType(PickType(${name}, [/* TODO: Fill an array of entity fields that can be updated */] as const)) {}
export class Update${name}Response {
  @IsObject()
  data: ${name};
}

export class Delete${name}Params extends PickType(${name}, ['id']) {}
export class Delete${name}Response {
  @IsObject() data: ${name};
}
`;
    (0, fs_1.mkdirSync)(`./src/api/rest/controllers/${fileName}`, { recursive: true });
    (0, fs_1.writeFileSync)(`./src/api/rest/controllers/${fileName}/${fileName}.dto.ts`, data);
}
function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function uncapitalizeFirstLetter(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
}
function generate(argv) {
    console.log('---------- \x1b[1;34m argv \x1b[0m ----------');
    console.log(argv);
    const ENTITY_NAME = capitalizeFirstLetter(argv.name);
    const OBJECT_NAME = uncapitalizeFirstLetter(argv.name);
    const DIR = argv.dir;
    console.log('---------- \x1b[1;34m ENTITY_NAME \x1b[0m ----------');
    console.log(ENTITY_NAME);
    // generateEntity(ENTITY_NAME, DIR);
    // generateRepositoryInterface(ENTITY_NAME, DIR);
    // generateRepository(ENTITY_NAME, OBJECT_NAME, DIR);
    // generateModule(ENTITY_NAME, DIR);
    // generateService(ENTITY_NAME, OBJECT_NAME, DIR);
    // generateDto(ENTITY_NAME, DIR);
}
exports.default = generate;
