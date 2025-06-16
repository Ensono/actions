# Process JSON

Recursively flattens JSON object into a key=value pair and creates task variables 

Example usage:

```
  - task: TerraformTaskV4@4
    name: terraformOut
    displayName: 'Terraform Output'
    inputs:
      command: 'output'
      workingDirectory: '${{ parameters.workingDirectory }}/azdevops/terraform'
      environmentServiceNameAzureRM: '${{ parameters.tf_service_connection }}'
      commandOptions: '-no-color'

  - task: processJsonOutput@0
    name: terraformOutputs
    inputs:
        jsonStringOrPath: $(terraformOut.jsonOutputVariablesPath)
        separator: "__"
        isTerraformOutput: true

  - task: useMeInAnotherTask
    name: foo
    inputs:
      nestedVar1: $(terraformOutputs.obj__nested__key1)
    
```

In case terraform outputs can replace these bash tasks and maintains the same behaviour

```
  - bash:
    
      # Loops over outputs in the JSON file created by the apply task
      cat $(terraformOut.jsonOutputVariablesPath) | jq -c -r '. | keys[]' | while read output_name; do
        output_value=$(jq -r ".$output_name.value" $(terraformOut.jsonOutputVariablesPath))
        is_sensitive=$(jq -r ".$output_name.sensitive" $(terraformOut.jsonOutputVariablesPath))

        # Set pipeline output variable
        echo "##vso[task.setvariable variable=$output_name;isOutput=true;isSecret=$is_sensitive]$output_value"
      done
    name: terraformOutputs
    displayName: Set Terraform Output Variables
```
