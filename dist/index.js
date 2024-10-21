"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = void 0;
const fs_1 = require("fs");
const yargs_1 = __importDefault(require("yargs"));
function generateEntity(name, fileName) {
    const data = `import { v4 as uuid } from 'uuid';

export class ${name} {
  public id: string;
  // TODO: Add entity fields
  public createdAt?: Date;

  constructor(init: Partial<${name}>) {
    this.id = init.id || uuid();
    this.createdAt = init.createdAt || new Date();
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
  list(options?: ListOptions<${name}>): Promise<ListResult<${name}>>;
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
import { BaseRepository } from './base/base.repository';
import * as _ from 'lodash';
  
@Injectable()
class Repository extends BaseRepository<${name}, ${name}Model> implements I${name}Repository {
  constructor(private readonly databaseService: DatabaseService) { }
  
   private fromEntity(${objectName}: Partial<${name}>): Omit<${name}Model, 'updatedAt'> {
    return {
      ...${objectName},
      createdAt: ${objectName}.createdAt || undefined,
    } as ${name}Model;
  }

  private toEntity(data: ${name}Model): ${name} {
    return new ${name}({
      ...data,
    });
  }
}

export const ${name}Repository: Provider = {
  provide:  '${name}Repository',
  useClass: Repository,
};
`;
    (0, fs_1.mkdirSync)(`./src/infra/repository/${fileName}`, { recursive: true });
    (0, fs_1.writeFileSync)(`./src/infra/database/repository/${fileName}.repository.ts`, data);
}
function generateModule(name, fileName) {
    const data = `import { Module } from '@nestjs/common';
import { RepositoryModule } from '../../infra/repository/repository.module';
import { ${name}Service } from './${fileName}.service';

@Module({
  imports:   [RepositoryModule],
  providers: [${name}Service],
  exports:   [${name}Service],
})
export class ${name}Module {}
`;
    (0, fs_1.writeFileSync)(`./src/domain/${fileName}/${fileName}.module.ts`, data);
}
function generateService(name, objectName, fileName) {
    const data = `import { Injectable, Inject } from '@nestjs/common';
import { ListOptions, ListResult } from '../domain.types';
import { I${name}Repository } from './${fileName}.repository.i';
import { ${name} } from './${fileName}.entity';

@Injectable()
export class ${name}Service {
  constructor(
    @Inject('${name}Repository')
    private readonly ${objectName}Repository: I${name}Repository
  ) { }

  async create(data: Partial<${name}>): Promise<${name}> {
    return this.${objectName}Repository.create(data);
  }

  async get(options: ListOptions<${name}>): Promise<${name}> {
    return this.${objectName}Repository.get(options);
  }
   
  public async getById(id: string): Promise<${name}> {
    return this.${objectName}Repository.getById(id);
  }
  
  async list(options?: ListOptions<${name}>): Promise<ListResult<${name}>> {
    return this.${objectName}Repository.list(options);
  }

  async update(id: string, data: Partial<Omit<${name}, 'id'>>): Promise<${name}> {
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
import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested, IsUUID, IsPositive, IsInt, IsOptional, IsObject, IsEnum, IsDateString } from 'class-validator';
import { PartialType, PickType } from '@nestjs/swagger';
import { SortDirection } from '../../types.dto';

export class ${name} {
  @IsString() @IsUUID() @IsNotEmpty() id: string;
  @IsDateString() @IsOptional() createdAt?: Date;
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
  
  // TODO: Add search filters from ${name} entity fields
  // @IsString() @IsEnum(SOME_FIELD_FROM_ENTITY_ENUM) @IsOptional() readonly SOME_FIELD_FROM_ENTITY?: SOME_FIELD_FROM_ENTITY_ENUM;
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
  @IsObject() data: ${name};
}

export class Delete${name}Params extends PickType(${name}, ['id']) {}
export class Delete${name}Response {
  @IsObject() data: Pick<${name}, 'id'>;
}
`;
    (0, fs_1.mkdirSync)(`./src/api/rest/controllers/${fileName}`, { recursive: true });
    (0, fs_1.writeFileSync)(`./src/api/rest/controllers/${fileName}/${fileName}.dto.ts`, data);
}
function generateController(name, objectName, fileName) {
    const data = `import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ${name}Service } from '../../../../domain/${fileName}/${fileName}.service';
import {
  Create${name}Response,
  Create${name}Body,
  Get${name}Response,
  Get${name}Params,
  List${name}sQuery,
  List${name}sResponse,
  Update${name}Body,
  Update${name}Response,
  Delete${name}Params,
  Delete${name}Response, Update${name}Params,
} from './${fileName}.dto';

@ApiTags('${name}s')
@Controller('${fileName}s')
export class ${name}Controller {
  constructor(private ${objectName}Service: ${name}Service) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create new ${fileName}' })
  public async create${name}(@Req() req, @Body() body: Create${name}Body): Promise<Create${name}Response> {
    const res = await this.${objectName}Service.create({
      ...body,
      // TODO: Check if you need userId while creating an entity
      // userId: req.user.id,
    });

    return {
      data: {
        id:        res.id,
        createdAt: res.createdAt,
        // TODO: Add other params to response
      },
    };
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'List ${fileName}s' })
  public async list${name}s(@Req() req, @Query() query: List${name}sQuery): Promise<List${name}sResponse> {
    const result = await this.${objectName}Service.list({
      skip:   query.skip,
      limit:  query.limit,
      sort:   query.sort ? [{ createdAt: query.sort }] : undefined,
      filter: {
        // userId: req.user.id,
        // TODO: Add other params for filter
      },
    });

    return {
      data: {
        total: result.total,
        items: result.items.map((item) => ({
          id:        item.id,
          createdAt: item.createdAt,
          // TODO: Add other params to response
        })),
      }
    };
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get ${fileName}' })
  public async get${name}(@Param() params: Get${name}Params): Promise<Get${name}Response> {
    return {
      data: await this.${objectName}Service.getById(params.id),
    };
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update ${fileName}' })
  async update${name}(
    @Req() req,
    @Param() params: Update${name}Params,
    @Body() update${name}Body: Update${name}Body
  ): Promise<Update${name}Response> {
    const res = await this.${objectName}Service.update(params.id, update${name}Body);

    return {
      data: {
        id:        res.id,
        createdAt: res.createdAt,
        // TODO: Add other params to response
      }
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete ${fileName}' })
  @UseGuards(AuthGuard('jwt'))
  async delete${name}(@Req() req, @Param() params: Delete${name}Params): Promise<Delete${name}Response> {
    await this.${objectName}Service.delete(params.id);

    return {
      data: {
        id: params.id,
     }
    };
  }
}
`;
    (0, fs_1.mkdirSync)(`./src/api/rest/controllers/${fileName}`, { recursive: true });
    (0, fs_1.writeFileSync)(`./src/api/rest/controllers/${fileName}/${fileName}.controller.ts`, data);
}
function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function uncapitalizeFirstLetter(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
}
function generate(options) {
    const isCurrentDirAProject = (0, fs_1.readdirSync)('.').some((file) => {
        return file === 'package.json';
    });
    if (!isCurrentDirAProject)
        console.error('Need to be in the root of DDD project directory!');
    const usage = '\nGenerates files for DDD project: domain folder with entity, controller with DTO and repository\n\n' +
        'Usage:   ddd-generate -n <EntityName> -d <entity-directory>\nExample: ddd-generate -n SomeEntity -d some-entity';
    const argv = (0, yargs_1.default)(options)
        .usage(usage)
        .option('n', { alias: 'name', describe: 'Name of entity', type: 'string', demandOption: true })
        .option('d', { alias: 'dir', describe: 'Directory name of entity', type: 'string', demandOption: true })
        .help(true)
        .argv;
    const ENTITY_NAME = capitalizeFirstLetter(argv.name);
    const OBJECT_NAME = uncapitalizeFirstLetter(argv.name);
    const DIR = argv.dir;
    generateEntity(ENTITY_NAME, DIR);
    generateRepositoryInterface(ENTITY_NAME, DIR);
    generateRepository(ENTITY_NAME, OBJECT_NAME, DIR);
    generateModule(ENTITY_NAME, DIR);
    generateService(ENTITY_NAME, OBJECT_NAME, DIR);
    generateDto(ENTITY_NAME, DIR);
    generateController(ENTITY_NAME, OBJECT_NAME, DIR);
}
exports.generate = generate;
