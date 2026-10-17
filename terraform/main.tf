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
  depends_on    = [aws_cloudformation_stack.registry]

  parameters = {
    ProjectName              = var.project_name
    Environment              = var.environment
    KubernetesVersion        = var.kubernetes_version
    KubernetesApiAccessCidrs = join(",", var.kubernetes_api_access_cidrs)
    JenkinsRoleArn           = var.jenkins_role_arn
    OperatorPrincipalArn     = var.kubernetes_operator_principal_arn
    DbInstanceClass          = var.db_instance_class
  }

  capabilities = ["CAPABILITY_IAM"]
  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}
