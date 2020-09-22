# Demo: Particles

Vamp Particles demo is created to demonstrate the effect of canary releasing in a visual way.

## Run

```sh
docker run -d -p 5000:5000 magneticio/particles:latest --color=#00ff00 --errorRate=2
```

Available arguments;

- **clusterCount**: Number of partifcle groups showing on the screen. This is results in the same number of requests fired to the API. Default is 10
- **particlesPerCluster**: Number of particles per cluster. Default is 50
- **backgroundColor**: Color of the background. This should be a hex value like `#00FF00`
- **backgroundImage**: Url of a background image which will be shown. When left empty no image will be displayed (`images/logo.svg` will show the Vamp logo)
- **backgroundImageLocation**: Location of where show the background image. This can be either `center` or `top`
- **backgroundImageTransparency**: Transparency value of the background image between 0 and 1. 1 will be no transparency, 0 will be full transparency.
- **errorRate**: Modulo value of how many requests will result with an error. 0 for none, 1 for all request, 2 for 50%, 3 for 33%, etc
- **updateInterval**: The interval between requests to the server. Default is 5000, which is 5000ms or 5s
- **healthCheckGracePeriodSeconds**: The period in which the health check always returns healthy. Default is 0s
- **resourceCheckGracePeriodSeconds**: The period after `healthCheckGracePeriodSeconds` has expired, during which the health check will return healthy but 20% of requests will result in an error. Default is 0s
- **minCPU**: The health check will fail if this value is greater than the Pod `resources.limits.cpu`. 100 is 100m or 0.1 vCPU
- **minMem**: The health check will fail if this value is greater than the Pod `resources.limits.memory`. 100 is 100Mi
- **extraMemPerRequest**: The Pod memory usage will be increased by this value, after every request. This simulates a memory leak. 10 for 10Ki

- **color**: Color of a particle. This should be a hex value like `#00FF00`
- **shape**: Shape of the particle. This can be either `circle` or `rectangle`

## License

Apache License 2.0, see [LICENSE](LICENSE).
