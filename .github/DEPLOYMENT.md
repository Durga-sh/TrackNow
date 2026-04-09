# TrackNow Deployment Guide

The TrackNow repository is configured with a robust set of CI/CD pipelines using GitHub Actions. This document outlines how it works and what you need to configure to deploy the stack to your own server.

## Pipeline Overview

1. **Continuous Integration (`ci.yml`)**: Runs on PRs and pushes to `main` and `develop`. It runs linters, unit tests, and validates Docker builds.
2. **Security Scanning (`security-scan.yml`)**: Runs weekly on Sundays. It runs `npm audit` and Trivy vulnerability scanning on the Docker images.
3. **Staging Deploy (`deploy-staging.yml`)**: Triggers on push to `develop`. Builds Docker images and pushes them to GitHub Container Registry (GHCR) with the `staging` label.
4. **Production Deploy (`deploy-production.yml`)**: Triggers on push to `main` (or manually). Builds and pushes production tags to GHCR, and if SSH secrets are configured, deploys to zero-downtime using Docker Compose on your server.

## How to Set Up Production Deployment

Since you have not deployed this anywhere yet, the pipelines are set up to use **GitHub Container Registry (GHCR)** for free, unlimited Docker image hosting. The deployment step uses SSH to execute `docker-compose` on a generic Linux server. 

### Prerequisites

1. Get a Linux VPS (e.g., Ubuntu server on DigitalOcean, AWS EC2, or Linode).
2. Install Docker and Docker Compose on the server.
3. Create a user with SSH access and permissions to run docker without `sudo`.

### GitHub Secrets Required

To enable the deployment step to your server, you must add the following **Repository Secrets** in GitHub (`Settings` -> `Secrets and variables` -> `Actions` -> `New repository secret`):

- `SSH_HOST`: The IP address or domain name of your server (e.g., `192.168.1.100`)
- `SSH_USER`: The SSH username (e.g., `ubuntu` or `root`)
- `SSH_PRIVATE_KEY`: Your private SSH key (e.g., the contents of your `~/.ssh/id_rsa`)

**Note:** You do **not** need a secret for Docker Hub. The system automatically provisions a `GITHUB_TOKEN` to push to your repository's free Container Registry.

## Local production testing

If you want to test the production artifacts locally before buying a server:

```bash
docker compose -f docker-compose.prod.yml up -d
```

*(Note that `docker-compose.prod.yml` expects images to exist. You may need to build them locally first if you haven't run the GH Actions).*
