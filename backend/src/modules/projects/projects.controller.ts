import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProjectsService } from './projects.service.js';

class CreateProjectDto {
  title!: string;
  summary!: string;
  category!: string;
  priority!: string;
  budget!: number;
  deadline!: string;
  skills!: string[];
  clientId!: string;
}

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List all projects' })
  @ApiResponse({ status: 200, description: 'Projects returned successfully' })
  async list(@Query('clientId') clientId?: string) {
    return this.projectsService.listProjects(clientId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new project request' })
  @ApiResponse({ status: 201, description: 'Project created' })
  async create(@Body() dto: CreateProjectDto) {
    return this.projectsService.createProject(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a single project' })
  @ApiResponse({ status: 200, description: 'Project returned' })
  async findOne(@Param('id') id: string) {
    return this.projectsService.findProjectById(id);
  }
}
