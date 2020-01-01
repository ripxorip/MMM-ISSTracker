# Module: ISS Tracker
`ISS Tracker` module
## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
	{
		module: "MMM-ISSTracker",
		position: "top_right",	// This can be any of the regions.
		config: {
			// See 'Configuration options' for more information.
			lat: xxx.xxxxx,
			lon: yyy.yyyyy
		}
	}
]
````

## Configuration options

The following properties can be configured:
