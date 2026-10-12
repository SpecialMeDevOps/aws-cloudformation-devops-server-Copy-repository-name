module "network" {
  source = "./modules/network"

  project_name = var.project_name
  environment  = var.environment
}

resource "aws_ecr_repository" "frontend" {
  name = "${var.project_name}-frontend"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "${var.project_name}-frontend"
    Environment = var.environment
  }
}

resource "aws_ecr_repository" "backend" {
  name = "${var.project_name}-backend"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "${var.project_name}-backend"
    Environment = var.environment
  }
}
