_Note:_ Docker Scout is a new product and is free while in early access. Read more about [Docker Scout](https://www.docker.com/products/docker-scout?utm_source=hub&utm_content=scout-action-readme).

# About

GitHub Action to run the Docker Scout CLI as part of your workflows.

## Inputs

## `command`

**Required** The name of command to run.

## `image`

Name of image, directory or archive to operate on.

## `args`

Additional args passed to Docker Scout.

## `user`

**Required** Docker Hub user id.

## `password`

**Required** Docker Hub password or PAT.

## `registry_user`

Registry user id for pull images.

## `registry_password`

Registry password or PAT for pulling images.

## Example usage

```yaml
      # 
      - name: Create CVE report
        uses: docker/scout-action@v1
        with:
          command: cves
          image: ${{ steps.meta.outputs.tags }}
          args: '--output image.sarif.json --format sarif' 
          # Authenticate with Docker Hub
          user: ${{ secrets.DOCKER_HUB_USER }}
          password: ${{ secrets.DOCKER_HUB_TOKEN }}
          
          # Optional registry authentication when pulling private images
          registry_user: ${{ github.actor }}
          registry_password: ${{ secrets.GITHUB_TOKEN }}
```  
