variable "aws_region" {
  description = "AWS region for the deployment environment."
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project prefix for CloudFormation stacks."
  type        = string
  default     = "it-your-it-house"
}

variable "deploy_application" {
  description = "Create or update the application CloudFormation stack after immutable image publication."
  type        = bool
  default     = false
}

variable "kubernetes_version" {
  description = "Supported Amazon EKS Kubernetes minor version."
  type        = string
  default     = "1.34"
  validation {
    condition     = can(regex("^1\\.(2[8-9]|[3-9][0-9])$", var.kubernetes_version))
    error_message = "kubernetes_version must be EKS 1.28 or newer to retain default envelope encryption for Kubernetes API data."
  }
}

variable "kubernetes_api_access_cidrs" {
  description = "Explicit IPv4 CIDRs allowed to connect to the EKS public API endpoint."
  type        = list(string)
  default     = []
  validation {
    condition = !var.deploy_application || (
      length(var.kubernetes_api_access_cidrs) > 0 &&
      alltrue([
        for cidr in var.kubernetes_api_access_cidrs :
        can(cidrhost(cidr, 0)) &&
        can(regex("^([0-9]{1,3}\\.){3}[0-9]{1,3}/([1-9]|[12][0-9]|3[0-2])$", cidr)) &&
        can(cidrhost(cidr, 0) == split("/", cidr)[0])
      ])
    )
    error_message = "Application deployment requires canonical, explicitly scoped IPv4 CIDRs for EKS API access; /0 is not allowed."
  }
}

variable "jenkins_role_arn" {
  description = "IAM role ARN used by Jenkins to deploy to the EKS cluster."
  type        = string
  default     = ""
  validation {
    condition     = !var.deploy_application || can(regex("^arn:aws:iam::[0-9]{12}:role/.+$", var.jenkins_role_arn))
    error_message = "Application deployment requires the Jenkins EC2 instance-profile IAM role ARN."
  }
}

variable "kubernetes_operator_principal_arn" {
  description = "IAM user or role ARN authorized to port-forward and inspect the demo namespace."
  type        = string
  default     = ""
  validation {
    condition     = !var.deploy_application || can(regex("^arn:aws:iam::[0-9]{12}:(role|user)/.+$", var.kubernetes_operator_principal_arn))
    error_message = "Application deployment requires an IAM user or role ARN for the Kubernetes operator."
  }
}

variable "db_instance_class" {
  description = "RDS PostgreSQL instance class; review cost and availability before applying."
  type        = string
  default     = "db.t4g.micro"
}
