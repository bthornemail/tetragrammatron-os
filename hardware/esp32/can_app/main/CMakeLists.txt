idf_component_register(
  SRCS
    "main.c"
    "../../../vm/can_vm.c"
    "../../../vm/can_codec.c"
    "../../../vm/can_poly.c"
    "../../../vm/can_objpool.c"
    "../../../vm/can_time_esp32.c"
  INCLUDE_DIRS
    "."
    "../../../vm"
)

target_compile_definitions(${COMPONENT_LIB} PRIVATE
  -DHW_TIME_REAL
)
