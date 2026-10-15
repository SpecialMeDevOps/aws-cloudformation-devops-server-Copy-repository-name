removed {
  from = aws_ecr_repository.frontend

  lifecycle {
    destroy = false
  }
}

removed {
  from = aws_ecr_repository.backend

  lifecycle {
    destroy = false
  }
}

removed {
  from = module.network

  lifecycle {
    destroy = false
  }
}

resource "aws_cloudformation_stack" "registry" {
  name          = "${var.project_name}-${var.environment}-registry"
  template_body = file("${path.module}/../cloudformation/registry-stack.yaml")

  parameters = {
    ProjectName = var.project_name
    Environment = var.environment
  }

  capabilities = ["CAPABILITY_IAM"]
  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_cloudformation_stack" "application" {
  count = var.deploy_application ? 1 : 0

  name          = "${var.project_name}-${var.environment}-application"
  template_body = file("${path.module}/../cloudformation/application-stack.yaml")
  depends_on    = [aws_cloudformation_stack.monitoring]

  parameters = {
    ProjectName            = var.project_name
    Environment            = var.environment
    FrontendImageUri       = var.frontend_image_uri
    BackendImageUri        = var.backend_image_uri
    CertificateArn         = var.certificate_arn
    AllowedWebIngressCidr  = var.allowed_web_ingress_cidr
    DbInstanceClass        = var.db_instance_class
    ServiceDesiredCount    = var.service_desired_count
    AmpRemoteWriteEndpoint = aws_cloudformation_stack.monitoring[0].outputs["RemoteWriteEndpoint"]
    AmpWorkspaceArn        = aws_cloudformation_stack.monitoring[0].outputs["WorkspaceArn"]
  }

  capabilities = ["CAPABILITY_IAM", "CAPABILITY_NAMED_IAM"]
  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_cloudformation_stack" "monitoring" {
  count = var.deploy_application ? 1 : 0

  name          = "${var.project_name}-${var.environment}-monitoring"
  template_body = file("${path.module}/../cloudformation/monitoring-stack.yaml")

  parameters = {
    ProjectName        = var.project_name
    Environment        = var.environment
    MonitoringRoleName = var.monitoring_instance_role_name
  }

  capabilities = ["CAPABILITY_IAM", "CAPABILITY_NAMED_IAM"]
  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}
